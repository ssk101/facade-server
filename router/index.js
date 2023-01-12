import express from 'express'
import apicache from 'apicache-plus'
import { Heap, mapKeys, kebabCase } from '@steelskysoftware/facade-toolbox'
import { Joi, joi } from '../middlewares/joi.js'
import { serialize } from '../middlewares/serialize.js'
import { errorHandler } from '../middlewares/error-handler.js'

const heap = new Heap()

export async function router(settings) {
  const {
    routes = {},
    middlewares = [],
    dataset = {},
    title = 'Untitled',
    src = 'application.js',
    namespace = '@steelskysoftware/facade-server',
    useRedis = false,
    routesBase = '',
  } = settings

  heap.namespace = namespace
  const router = express.Router()
  let cache = apicache

  if(useRedis) {
    try {
      const redis = await import('redis')
      cache = apicache.options({
        redisClient: redis.createClient({ detect_buffers: true }),
      })
    } catch (e) {
      heap.warn('Redis is not installed.', e)
    }
  }

  router.use(errorHandler)

  router.use((req, res, next) => {
    req.Joi = Joi
    next()
  })

  for(const middleware of middlewares) {
    router.use(middleware)
  }

  for(const [path, route] of Object.entries(routes)) {
    const {
      method = 'get',
      handlers,
      cacheDuration,
      serialization = {},
    } = route

    const prefixedPath = `${routesBase}${path}`

    const args = [
      cacheDuration ? cache(cacheDuration) : null,
      ...handlers.map(handler => {
        if(handler === Object(handler) && handler.validations) {
          return joi(handler.validations)
        }
        if(typeof handler === 'function') {
          return serialize(serialization, handler)
        }

        heap.warn(`A handler for path ${prefixedPath} was skipped, not a validation function or a handler function!`)
      }).filter(handler => handler)
    ].filter(arg => arg)

    router[method.toLowerCase()](prefixedPath, ...args)
  }

  if(settings.client) {
    router.get('*', (req, res, next) => {
      req.title = title
      req.config = Object.assign(mapKeys(dataset, (k, v) => {
        return `data-${kebabCase(k)}`
      }), { src })

      if(settings.viewEngine) {
        res.render('index', req)
      }
    })
  }

  return router
}