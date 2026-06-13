// Production server for the TanStack Start build.
// `vite build` emits a Web `fetch` handler at dist/server/server.js and hashed
// client assets in dist/client. This entry serves the static assets and hands
// everything else to the SSR/server-function handler. Zero extra dependencies.
import { createServer } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import { Readable } from 'node:stream'
import serverEntry from './dist/server/server.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'
const CLIENT_DIR = join(process.cwd(), 'dist', 'client')

const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
}

async function tryServeStatic(res, pathname) {
  // Strip any path traversal, then resolve inside the client dir.
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(CLIENT_DIR, rel)
  if (!filePath.startsWith(CLIENT_DIR)) return false
  try {
    const s = await stat(filePath)
    if (!s.isFile()) return false
    const data = await readFile(filePath)
    res.statusCode = 200
    res.setHeader('content-type', MIME[extname(filePath)] || 'application/octet-stream')
    res.setHeader('cache-control', 'public, max-age=31536000, immutable')
    res.end(data)
    return true
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    // Hashed, immutable client assets and user uploads are served directly.
    if (req.method === 'GET' && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/uploads/'))) {
      if (await tryServeStatic(res, url.pathname)) return
    }

    const method = req.method || 'GET'
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) for (const v of value) headers.append(key, v)
      else if (value != null) headers.set(key, value)
    }

    const hasBody = method !== 'GET' && method !== 'HEAD'
    const request = new Request(url, {
      method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
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
    console.error('[server] request failed:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('Internal Server Error')
    } else {
      res.end()
    }
  }
})

server.listen(PORT, HOST, () => {
  console.log(`KostManager running on http://${HOST}:${PORT}`)
})
