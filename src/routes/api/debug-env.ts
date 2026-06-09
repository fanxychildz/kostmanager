import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/debug-env')({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT_SET',
            VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
            NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
            DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT' : 'NOT_SET',
            DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN ? 'PRESENT' : 'NOT_SET',
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'PRESENT' : 'NOT_SET',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'PRESENT' : 'NOT_SET',
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'PRESENT' : 'NOT_SET',
          }, null, 2),
          {
            headers: { 'content-type': 'application/json' },
          }
        )
      },
    },
  },
})
