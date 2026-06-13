import { createFileRoute } from '@tanstack/react-router'
import { nanoid } from 'nanoid'

export const Route = createFileRoute('/api/payments/$id/status')({
  server: {
    handlers: {
      PATCH: async ({ request, params }: { request: Request; params: { id: string } }) => {
        const { auth } = await import('~/server/auth')
        const { db } = await import('~/db')
        const { payments, bills, tenants, inbox } = await import('~/db/schema')
        const { eq, and } = await import('drizzle-orm')

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
          const { recalculateBillStatus } = await import('~/server/payments-db')
          await recalculateBillStatus(existing[0].billId)

          // 4. Kirim notifikasi inbox ke tenant mengenai perubahan status pembayaran
          const [tenantRow] = await db
            .select({ id: tenants.id, userId: tenants.userId, propertyId: tenants.propertyId })
            .from(tenants)
            .innerJoin(bills, eq(bills.tenantId, tenants.id))
            .where(eq(bills.id, existing[0].billId))
            .limit(1)

          if (tenantRow?.userId) {
            const subjectText = status === 'paid' ? 'Pembayaran Dikonfirmasi' : 'Pembayaran Ditolak'
            const bodyText = status === 'paid'
              ? 'Bukti pembayaran Anda telah dikonfirmasi dan status tagihan Anda telah diperbarui menjadi lunas.'
              : 'Bukti pembayaran Anda ditolak oleh pengelola. Mohon unggah bukti pembayaran yang valid.'

            await db.insert(inbox).values({
              id: nanoid(),
              createdAt: now,
              updatedAt: now,
              userId: tenantRow.userId,
              propertyId: tenantRow.propertyId,
              senderId: session.user.id,
              senderName: session.user.name || 'Pengelola Kost',
              recipientType: 'tenant',
              recipientPropertyId: tenantRow.propertyId,
              recipientTenantId: tenantRow.id,
              subject: subjectText,
              body: bodyText,
              category: 'pembayaran',
              isRead: false,
              readAt: null,
              priority: 'normal',
              status: 'unread',
            })
          }

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
