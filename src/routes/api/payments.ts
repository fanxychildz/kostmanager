import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { payments, bills, tenants, properties, units } from '~/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const Route = createFileRoute('/api/payments')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
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

        try {
          // Fetch properties owned by owner
          const propertiesOwned = await db
            .select({ id: properties.id })
            .from(properties)
            .where(eq(properties.ownerId, session.user.id))
          
          const propertyIds = propertiesOwned.map((p) => p.id)

          if (propertyIds.length === 0) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            })
          }

          const formattedRows = await db
            .select({
              id: payments.id,
              billId: payments.billId,
              recordedBy: payments.recordedBy,
              paymentMethod: payments.paymentMethod,
              amount: payments.amount,
              paidAt: payments.paidAt,
              notes: payments.notes,
              status: payments.status,
              proofImage: payments.proofImage,
              createdAt: payments.createdAt,
              updatedAt: payments.updatedAt,
              tenantName: tenants.fullName,
              unitNumber: units.unitNumber,
            })
            .from(payments)
            .innerJoin(bills, eq(bills.id, payments.billId))
            .innerJoin(tenants, eq(tenants.id, bills.tenantId))
            .leftJoin(units, eq(units.id, bills.unitId))
            .where(inArray(tenants.propertyId, propertyIds))
            .orderBy(desc(payments.createdAt))
            .limit(200)

          return new Response(JSON.stringify(formattedRows), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
      POST: async ({ request }: { request: Request }) => {
        let session: any = null
        try {
          session = await auth.api.getSession({ headers: request.headers })
        } catch {
          session = null
        }

        if (!session) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
        }

        try {
          const body = await request.json()
          const { billId, amount, paymentMethod, paidAt, proofImage } = body

          if (!billId || !amount || !paymentMethod || !paidAt) {
            return new Response(
              JSON.stringify({ error: 'Data pembayaran tidak lengkap.' }),
              { status: 400, headers: { 'content-type': 'application/json' } }
            )
          }

          // 1. Ambil tagihan
          const billRow = await db
            .select({
              id: bills.id,
              totalAmount: bills.totalAmount,
              status: bills.status,
            })
            .from(bills)
            .where(eq(bills.id, billId))
            .limit(1)

          if (billRow.length === 0) {
            return new Response(
              JSON.stringify({ error: 'Tagihan tidak ditemukan.' }),
              { status: 404, headers: { 'content-type': 'application/json' } }
            )
          }

          const bill = billRow[0]

          // 2. Jangan terima jika bill sudah ada pembayaran paid/recorded (Lunas)
          const existingPaid = await db
            .select({ id: payments.id })
            .from(payments)
            .where(
              and(
                eq(payments.billId, billId),
                inArray(payments.status, ['paid', 'recorded'])
              )
            )
            .limit(1)

          if (existingPaid.length > 0) {
            return new Response(
              JSON.stringify({ error: 'Tagihan ini sudah memiliki catatan pembayaran lunas.' }),
              { status: 400, headers: { 'content-type': 'application/json' } }
            )
          }

          // 3. Validasi nominal >= totalAmount
          const paymentAmount = Number(amount)
          if (paymentAmount < bill.totalAmount) {
            return new Response(
              JSON.stringify({ error: `Nominal kurang. Minimal pembayaran adalah ${bill.totalAmount}.` }),
              { status: 400, headers: { 'content-type': 'application/json' } }
            )
          }

          // 4. Simpan gambar bukti transfer jika ada
          let proofImageUrl: string | null = null
          const { saveProofImage, recalculateBillStatus } = await import('~/server/payments-db')
          if (proofImage) {
            proofImageUrl = await saveProofImage(proofImage)
          }

          // 5. Tentukan status awal
          // Penghuni (tenant) -> pending, Pengelola (owner) -> paid
          const initialStatus = session.user.role === 'tenant' ? 'pending' : 'paid'

          const now = new Date()
          const paymentId = nanoid()

          await db.insert(payments).values({
            id: paymentId,
            billId,
            recordedBy: session.user.id,
            paymentMethod: paymentMethod as any,
            amount: paymentAmount,
            paidAt: new Date(paidAt),
            notes: body.notes || (session.user.role === 'tenant' ? 'Pembayaran via Portal Penghuni' : 'Dicatat langsung oleh pengelola'),
            status: initialStatus,
            proofImage: proofImageUrl,
            createdAt: now,
            updatedAt: now,
          })

          // 6. Sinkronisasi status tagihan jika diinput langsung oleh pengelola (lunas)
          if (initialStatus === 'paid') {
            await recalculateBillStatus(billId)
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: initialStatus === 'pending'
                ? 'Pembayaran telah tercatat dan menunggu konfirmasi pengelola'
                : 'Pembayaran berhasil dicatat',
              payment: {
                id: paymentId,
                status: initialStatus,
              },
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
