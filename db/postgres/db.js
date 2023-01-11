import { Heap } from '@steelskysoftware/facade-toolbox'

export class DB {
  constructor(db) {
    this.db = db
    this.heap = new Heap('DB')
  }

  async query(strings, ...args) {
    try {
      const { rows } = await this.db.raw(
        strings.join('?'),
        args.filter(a => {
          return typeof a !== 'undefined' && a !== null
        })
      )
      return rows
    } catch (e) {
      this.heap.error(e)
      throw e
    }
  }
}
