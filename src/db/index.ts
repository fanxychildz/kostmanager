import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const client = createClient({
  url: process.env.DATABASE_URL || 'file:kostmanager.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

export function isTurso() {
  const url = process.env.DATABASE_URL || ''
  return url.includes('turso.io')
}
