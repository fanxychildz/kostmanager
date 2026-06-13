import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { payments } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { recalculateBillStatus } from '~/server/payments'

export const Route = createFileRoute('/api/payments/$id/status')({
  server: {
    handlers: {
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        let session: any = null
        try {
          session = await auth.api.getSession({ headers: request.headers })
        } catch {
          session = null
        }

        if (!session || session.user.role !== 'owner') {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
        }

        const { id } = params
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID pembayaran tidak valid.' }),
            { status: 400, headers: { 'content-type': 'application/json' } }
          )
        }

        try {
          const body = await request.json()
          const { status } = body

          if (!status || !['paid', 'rejected'].includes(status)) {
            return new Response(
              JSON.stringify({ error: 'Status tidak valid. Harus paid atau rejected.' }),
              { status: 400, headers: { 'content-type': 'application/json' } }
            )
          }

          // 1. Ambil data pembayaran
          const existing = await db
            .select({
              id: payments.id,
              billId: payments.billId,
              status: payments.status,
            })
            .from(payments)
            .where(eq(payments.id, id))
            .limit(1)

          if (existing.length === 0) {
            return new Response(
              JSON.stringify({ error: 'Pembayaran tidak ditemukan.' }),
              { status: 404, headers: { 'content-type': 'application/json' } }
            )
          }

          // 2. Update status pembayaran
          const now = new Date()
          await db
            .update(payments)
            .set({
              status: status as any,
              updatedAt: now,
            })
            .where(eq(payments.id, id))

          // 3. Sinkronisasi status tagihan terkait
          await recalculateBillStatus(existing[0].billId)

          return new Response(
            JSON.stringify({
              success: true,
              message: `Status pembayaran berhasil diperbarui menjadi ${status}`,
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message || 'Terjadi kesalahan internal.' }),
            { status: 500, headers: { 'content-type': 'application/json' } }
          )
        }
      },
    },
  },
})
