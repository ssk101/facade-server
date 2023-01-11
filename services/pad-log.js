import fs from 'fs-extra'
import path from 'path'

export async function padLog(fileName, s = '\n', n = 20) {
  return new Promise((resolve, reject) => {
    try {
      fs.appendFileSync(
        path.join(process.cwd(), fileName),
        [...Array(n).keys()].map(i => s).join(''),
        { encoding: 'utf8' }
      )

      resolve()
    } catch (e) {
      reject(e)
    }
  })
}
