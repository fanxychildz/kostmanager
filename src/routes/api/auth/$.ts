import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        console.log('[api-auth-route] GET request:', request.url)
        const { auth } = await import('~/server/auth')
        return auth.handler(request)
      },
      POST: async ({ request }) => {
        console.log('[api-auth-route] POST request:', request.url)
        const { auth } = await import('~/server/auth')
        return auth.handler(request)
      },
    },
  },
})
