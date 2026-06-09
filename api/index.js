import { createServer } from 'http'
import { stat, readFile } from 'fs/promises'
import { join, normalize, extname } from 'path'
import { Readable } from 'stream'
import serverEntry from '../dist/server/server.js'

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

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    // If req.body is already parsed/provided by Vercel
    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        return resolve(Buffer.from(req.body))
      }
      if (Buffer.isBuffer(req.body)) {
        return resolve(req.body)
      }
      return resolve(Buffer.from(JSON.stringify(req.body)))
    }

    // If stream is already ended
    if (req.readableEnded) {
      return resolve(Buffer.alloc(0))
    }

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

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      if (await tryServeStatic(res, url.pathname)) return
    }

    const method = req.method || 'GET'
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
    console.error('[api] request failed:', err)
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('Internal Server Error')
    } else {
      res.end()
    }
  }
}
