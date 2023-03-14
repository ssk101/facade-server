import express from 'express'
import compression from 'compression'
import path from 'path'
import terminator from 'http-terminator'
import http from 'http'
import readline from 'readline'
import { HeapLogger } from '@steelskysoftware/facade-toolbox'

const heap = new HeapLogger()
const { createHttpTerminator } = terminator

export async function createServer(config = {}) {
  const { app, db } = await createApp(config)

  config.app ??= app
  config.db ??= db

  const settings = Object.assign({}, {
    port: 3000,
    namespace: '@facade/server',
    onExit: function() {},
  }, config)

  heap.namespace = settings.namespace

  const server = http.createServer(settings.app)

  const graceful = createHttpTerminator({
    gracefulTerminationTimeout: 1 * 1000,
    server,
  })

  server.listen(settings.port)
  heap.info('Listening on', settings.port)

  process.on('SIGUSR2', () => {
    require('v8').writeHeapSnapshot()
  })

  process.on('SIGABRT', () => {
    settings.onExit()
    server.close(() => {
      process.exit()
    })
  })

  process.on('SIGTERM', () => {
    settings.onExit()
    server.close(() => {
      process.exit()
    })
  })

  process.on('SIGINT', () => {
    settings.onExit()
    server.close(() => {
      process.exit()
    })
  })

  process.on('exit', () => {
    settings.onExit()
    server.close()
  })

  if (process.platform === 'win32') {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.on('SIGINT', () => {
      process.emit('SIGINT')
    })
  }

  return Object.assign(server, { db })
}

export async function createApp(config = {}) {
  const defaults = {
    buildDir: 'build',
    publicDir: 'public',
    viewsDir: 'views',
    viewEngine: false,
    favicon: '',
    compress: true,
    db: {},
    json: {
      limit: '50MB',
      strict: true,
      inflate: true,
      type: ['application/json'],
    },
    cors: Object.assign({
      methods: ['GET', 'POST', 'PATCH', 'PUT'],
      allowedHeaders: [
        'Content-Type',
      ],
    }, config.cors || {}),
    middlewares: [],
  }

  const settings = Object.assign({}, defaults, config)

  let db

  const app = express()
  app.enable('trust proxy')
  app.disable('x-powered-by')
  app.set('startTime', new Date())
  if(settings.compress) {
    app.use(compression())
  }
  app.use(express.json(settings.json))

  if(settings.cors) {
    const { default: cors } = await import('cors')
    app.use(cors(settings.cors))
  }

  if(settings.client && settings.favicon) {
    const serveFavicon = await import('serve-favicon')

    app.use(serveFavicon(
      path.join(process.cwd(), settings.publicDir, settings.favicon)
    ))
  }

  if(settings.viewEngine) {
    app.set('views', path.join(process.cwd(), settings.viewsDir))
    app.set('view engine', settings.viewEngine)
  }

  if(settings.client) {
    app.use(express.static(settings.buildDir))
    app.use(express.static(settings.publicDir))
  }

  if(settings.db?.connectionString) {
    const { connect } = await import('../db/postgres/connect.js')
    const { Knex, db: database } = await connect(settings.db)
    db = database

    app.use(async (req, res, next) => {
      Object.assign(req, { Knex, db })
      next()
    })
  }

  for(const middleware of settings.middlewares) {
    if(typeof middleware !== 'function') {
      heap.warn('Middleware is not a function, got', middleware)
      continue
    }

    app.use(middleware)
  }

  if(settings.routes) {
    const { router } = await import('../router/index.js')
    app.use(await router(settings))
  }

  return { app, db }
}

function hastaLaVista(baby) {
  baby.terminate()
    .catch(err => heap.error(err))
    .finally(async () => {
      let a = Buffer.from(
        `IllvdSdyZSB0ZXJtaW5hdGVkLCBmdWNrZXIufEtuaXZlcywgYW5kIHN0YWJiaW5nIHdlYXBvbnMufEkgc3dlYXIgSSB3aWxsIG5vdCBraWxsIGFueW9uZS58WW91ciBmb3N0ZXIgcGFyZW50cyBhcmUgZGVhZC58Q29tZSB3aXRoIG1lIGlmIHlvdSB3YW50IHRvIGxpdmUufEhhdmUgeW91IHNlZW4gdGhpcyBib3k/fEkga25vdyBub3cgd2h5IHlvdSBjcnkuIEJ1dCBpdCBpcyBzb21ldGhpbmcgSSBjYW4gbmV2ZXIgZG8ufEknbGwgYmUgYmFjay58VGhlcmUncyBubyBmYXRlIGJ1dCB3aGF0IHdlIG1ha2UufEkgbmVlZCB5b3VyIGNsb3RoZXMsIHlvdXIgYm9vdHMgYW5kIHlvdXIgbW90b3JjeWNsZS58TmljZSBuaWdodCBmb3IgYSB3YWxrLiBOb3RoaW5nIGNsZWFuLCByaWdodD8i`
      , 'base64').toString().split('|')
      heap.log('\n', a[Math.floor(Math.random() * a.length)])
    })
}
