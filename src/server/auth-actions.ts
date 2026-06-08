import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'

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
  .inputValidator((d: { email: string; password: string; name: string }) => d)
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
