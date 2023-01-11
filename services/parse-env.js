import path from 'path'
import dotenv from 'dotenv'
import { camelCase } from '@steelskysoftware/facade-toolbox'

export function parseEnv(dirs) {
  return [...(dirs || [process.cwd()])].map(dir => {
    return dotenv.config({ path: path.join(dir, '.env') })
  })
  .reduce((acc, { parsed }) => {
    for(const key in parsed) {
      let deserialized
      try {
        deserialized = JSON.parse(parsed[key])
      } catch (e) {
        deserialized = JSON.parse(`"${parsed[key]}"`)
      }

      acc[camelCase(key.toLowerCase())] = deserialized
    }
    return acc
  }, {})
}
