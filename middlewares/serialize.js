import {
  camelKeys as camelCase,
  snakeKeys as snakeCase,
  kebabKeys as kebabCase,
} from '@steelskysoftware/facade-toolbox'

const keyTransformers = {
  camelCase,
  snakeCase,
  kebabCase,
}

export function serialize(opts, handler) {
  const { transformKeys = 'camelCase' } = opts
  const keyTransformer = keyTransformers[transformKeys]

  return async function(req, res, next) {
    try {
      const response = await handler(req, res, next)

      if(Buffer.isBuffer(response)) {
        res.set('Content-Encoding', 'gzip')
        res.set('Content-Type', 'application/json')
        res.send(response)
      } else {
        res.json(keyTransformer ? keyTransformer(response) : response)
      }
    } catch (err) {
      next(err)
    }
  }
}
