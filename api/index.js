import { Readable } from 'node:stream'
import serverEntry from '../dist/server/server.js'

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => { chunks.push(chunk) })
    req.on('end', () => { resolve(Buffer.concat(chunks)) })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  try {
    const proto = req.headers['x-forwarded-proto'] || 'http'
    const url = new URL(req.url, `${proto}://${req.headers.host || 'localhost'}`)
    const method = req.method || 'GET'

    console.log('[vercel-server] handling request:', method, url.pathname)

    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v)
      } else if (value != null) {
        headers.set(key, value)
      }
    }

    const hasBody = method !== 'GET' && method !== 'HEAD'
    const body = hasBody ? await getRawBody(req) : undefined
    const request = new Request(url, {
      method,
      headers,
      body,
    })

    const response = await serverEntry.fetch(request)

    res.statusCode = response.status
    const setCookies =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : []
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') return
      res.setHeader(key, value)
    })
    if (setCookies.length > 0) res.setHeader('set-cookie', setCookies)

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res)
    } else {
      res.end()
    }
  } catch (err) {
    console.error('[vercel-server] request failed:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('Internal Server Error')
    } else {
      res.end()
    }
  }
}
