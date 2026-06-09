import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'

export const Route = createFileRoute('/api/auth/callback/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        return auth.handler(request)
      },
    },
  },
})
