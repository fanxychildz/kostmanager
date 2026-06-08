import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

export const auth = betterAuth({
  baseURL,
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'kostmanager-dev-secret-change-me-in-production',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phone: { type: 'string', required: false },
      // role is assigned server-side (owner on signup, tenant via portal register).
      // input: false prevents clients from setting it during sign-up.
      role: { type: 'string', required: false, defaultValue: 'owner', input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [baseURL],
})
