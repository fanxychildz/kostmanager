import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// better-auth issues the session cookie via a Set-Cookie header. When we call
// it through `auth.api.*` inside a server function, that header is discarded
// unless we explicitly forward it onto the server function's response.
function forwardAuthCookies(headers: Headers) {
  const cookies = headers.getSetCookie()
  if (cookies.length === 0) return
  setResponseHeader('set-cookie', cookies.length === 1 ? cookies[0] : cookies)
}

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  return session
})

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { headers, response } = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
      headers: request.headers,
      returnHeaders: true,
    })
    forwardAuthCookies(headers)
    return response
  })

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string; name: string; plan?: 'gratis' | 'pro' }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { headers, response } = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
      headers: request.headers,
      returnHeaders: true,
    })
    forwardAuthCookies(headers)

    if (response && response.user) {
      const now = new Date()
      if (data.plan === 'pro') {
        // 14 days free trial for Pro
        const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        await db.update(users).set({
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiry,
          updatedAt: now,
        }).where(eq(users.id, response.user.id))
      } else {
        // Free / Gratis plan: unlimited expiry, but capped to 10 rooms in createUnit
        await db.update(users).set({
          subscriptionStatus: 'active',
          subscriptionExpiresAt: null,
          updatedAt: now,
        }).where(eq(users.id, response.user.id))
      }
    }

    return response
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest()
  const { headers } = await auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
  })
  forwardAuthCookies(headers)
  return { success: true }
})

export const signInSocial = createServerFn({ method: 'POST' })
  .inputValidator((d: { provider: 'google'; callbackURL?: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { headers, response } = await auth.api.signInSocial({
      body: {
        provider: data.provider,
        callbackURL: data.callbackURL,
      },
      headers: request.headers,
      returnHeaders: true,
    })
    forwardAuthCookies(headers)
    return response
  })
