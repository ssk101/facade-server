import KNEX from 'knex'
import fs from 'fs-extra'
import pg from 'pg'
import pgParse from 'pg-connection-string'
import { DB } from './db.js'
import { Heap } from '@steelskysoftware/facade-toolbox'

const heap = new Heap('DB - Connect')

export async function connect(config = {}) {
  const {
    connectionString,
    acquireConnectionTimeout = 10000,
    asyncStackTraces = true,
    pool = { min: 0, max: 35 },
  } = config

  if(!config.connectionString) {
    const e = 'Missing connectionString.'
    heap.error(e)
    throw new Error(e)
  }

  const Knex = await KNEX({
    client: 'pg',
    connection: pgParse(connectionString),
    asyncStackTraces,
    acquireConnectionTimeout,
    pool,
  })

  const db = new DB(Knex)

  return {
    Knex,
    db,
  }
}
