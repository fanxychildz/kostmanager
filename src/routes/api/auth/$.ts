import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        console.log('[api-auth-route] GET request:', request.url)
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        console.log('[api-auth-route] POST request:', request.url)
        return auth.handler(request)
      },
    },
  },
})
