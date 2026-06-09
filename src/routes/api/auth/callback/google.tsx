import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'

export const Route = createFileRoute('/api/auth/callback/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url)
        const error = searchParams.get('error')
        if (error === 'access_denied') {
          return new Response('Akses dibatalkan', { status: 400 })
        }
        if (error) {
          return new Response(`OAuth error: ${error}`, { status: 400 })
        }
        return auth.handler(request)
      },
      POST: async ({ request }) => auth.handler(request),
    },
  },
})
