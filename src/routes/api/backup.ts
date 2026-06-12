import { createFileRoute } from '@tanstack/react-router'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { auth } from '~/server/auth'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/backup
//
// Endpoint aman untuk download file database kostmanager.db.
//
// Keamanan berlapis:
//   1. Session check — hanya user yang sudah login (owner) yang bisa akses
//   2. Role check — hanya user dengan role 'owner' yang diizinkan
//   3. Email check — hanya email owner yang terdaftar di OWNER_EMAIL (env var)
//   4. Secret key — opsional, bisa tambahkan header X-Backup-Key untuk keamanan ekstra
//
// Cara akses:
//   - Login ke dashboard dulu, lalu buka URL: /api/backup
//   - File kostmanager.db langsung terdownload otomatis
// ─────────────────────────────────────────────────────────────────────────────

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'taufiqrusdhi.ez@gmail.com'

export const Route = createFileRoute('/api/backup')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        // ── 1. Cek session login ──────────────────────────────────────────
        let session: any = null
        try {
          session = await auth.api.getSession({ headers: request.headers })
        } catch {
          session = null
        }

        if (!session?.user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized: Silakan login terlebih dahulu.' }),
            {
              status: 401,
              headers: { 'content-type': 'application/json' },
            }
          )
        }

        // ── 2. Cek role (harus owner) ─────────────────────────────────────
        const userRole = (session.user as any).role
        if (userRole !== 'owner') {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Hanya owner yang dapat mengakses backup database.' }),
            {
              status: 403,
              headers: { 'content-type': 'application/json' },
            }
          )
        }

        // ── 3. Cek email owner ────────────────────────────────────────────
        const userEmail = session.user.email
        if (userEmail !== OWNER_EMAIL) {
          return new Response(
            JSON.stringify({ error: `Forbidden: Akses backup hanya untuk ${OWNER_EMAIL}.` }),
            {
              status: 403,
              headers: { 'content-type': 'application/json' },
            }
          )
        }

        // ── 4. Baca file database ─────────────────────────────────────────
        const dbPath = join(process.cwd(), 'kostmanager.db')

        let fileBuffer: Buffer
        let fileSize: number

        try {
          const fileStat = await stat(dbPath)
          fileSize = fileStat.size

          if (fileSize === 0) {
            return new Response(
              JSON.stringify({ error: 'Database kosong (0 bytes). Kemungkinan Vercel tidak persisten file ini.' }),
              {
                status: 500,
                headers: { 'content-type': 'application/json' },
              }
            )
          }

          fileBuffer = await readFile(dbPath)
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: 'Database tidak ditemukan di server.',
              detail: err?.message || String(err),
              path: dbPath,
              note: 'Di Vercel serverless, SQLite tidak persisten antar deployment.',
            }),
            {
              status: 404,
              headers: { 'content-type': 'application/json' },
            }
          )
        }

        // ── 5. Return file sebagai download ───────────────────────────────
        const now = new Date()
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
        const filename = `kostmanager-backup-${dateStr}-${timeStr}.db`

        console.log(`[backup] Download oleh ${userEmail} — ${filename} (${fileSize} bytes)`)

        return new Response(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'content-type': 'application/octet-stream',
            'content-disposition': `attachment; filename="${filename}"`,
            'content-length': String(fileSize),
            'x-backup-size': String(fileSize),
            'x-backup-date': now.toISOString(),
            // Jangan cache response backup
            'cache-control': 'no-store, no-cache, must-revalidate',
          },
        })
      },
    },
  },
})
