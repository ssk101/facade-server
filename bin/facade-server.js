#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import path from 'path'
import {
  migrateLatest,
  makeMigration,
  rollback,
} from '../db/postgres/migrations.js'

async function getConnectionString(configPath) {
  let connectionString = process.env.CONNECTION_STRING
  
  if(!connectionString) {
    const { default: config } = await import(path.join(process.cwd(), configPath))
    connectionString = config.connectionString
  }
  
  if(!connectionString) {
    throw new Error([
      'Missing configuration file or CONNECTION_STRING.',
      'Set CONNECTION_STRING environment variable',
      'or input -c [file] or --config [file]',
    ].join(' '))
  }

  return connectionString
}

yargs(hideBin(process.argv))
  .command({
    command: 'mkmg',
    handler: ({ n }) => {
      return makeMigration(n || 'migration')
    }
  })
  .command({
    command: 'rollback',
    handler: async ({ c }) => {
      try {
        const connectionString = await getConnectionString(c)
        return rollback(connectionString)
      } catch (e) {
        console.error(e)
        process.exit(0)
      }
    }
  })
  .command({
    command: 'migrate',
    handler: async ({ c }) => {
      try {
        const connectionString = await getConnectionString(c)
        return migrateLatest(connectionString)
      } catch (e) {
        console.error(e)
        process.exit(0)
      }
    }
  })
  .demandCommand()
  .argv
