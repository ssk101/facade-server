import fs from 'fs'
import path from 'path'
import { connect } from './connect.js'
import { datetimestamp } from '@steelskysoftware/facade-toolbox'
import { Heap } from '@steelskysoftware/facade-toolbox'

const heap = new Heap('SQL - Migrations')

export function makeMigration(name) {
  const template = [
    'export async function up(knex) {',
    '  const sql = (strs, ...args) => knex.raw(strs.join(\'?\'), args)',
    '  ',
    '  await sql`',
    '  ',
    '  `',
    '}',
    '',
    'export async function down(knex) {',
    '  const sql = (strs, ...args) => knex.raw(strs.join(\'?\'), args)',
    '  ',
    '  await sql`',
    '  ',
    '  `',
    '}',
  ].join('\n')

  const stamp = datetimestamp()
  const filePath = path.join(process.cwd(), 'migrations', `${stamp}_${name}.js`)
  fs.writeFileSync(filePath, template, 'utf8')
  heap.info(filePath)
}

export async function rollback(connectionString) {
  try {
    const { Knex } = await connect({ connectionString })
    return Knex.migrate.rollback()
  } catch (e) {
    heap.error(e)
    throw new Error(e)
  }
}

export async function migrateLatest(connectionString) {
  try {
    const { Knex } = await connect({ connectionString })
    return Knex.migrate.latest()
      .then(() => {})
      .then(() => heap.info('Done'))
  } catch (e) {
    heap.error(e)
    throw new Error(e)
  }
}