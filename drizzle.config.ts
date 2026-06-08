import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: process.env.DATABASE_URL?.startsWith('libsql:') ? 'turso' : 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'kostmanager.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config
