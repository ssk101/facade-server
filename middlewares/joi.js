import Joi from 'joi'

function joi(cb) {
  return function(req, res, next) {
    const schema = cb(req, res, next)

    let result = schema.validate({
      ...req.body,
      ...req.params,
      ...req.query
    },
    {
      stripUnknown: true
    })

    if(result.error){
      res.status(400)
      throw new Error(result.error.details[0].message)
    }
    req.joi = result.value
    next()
  }
}

export { Joi, joi }