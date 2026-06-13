import { createFileRoute } from '@tanstack/react-router'
import { auth } from '~/server/auth'
import { getUpcomingBillsDraft } from '~/server/bills-db'
import { db } from '~/db'
import { bills, tenants, inbox } from '~/db/schema'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/bills/upcoming')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        let session: any = null
        try {
          session = await auth.api.getSession({ headers: request.headers })
        } catch {
          session = null
        }

        const cronSecret = process.env.CRON_SECRET || 'local_secret'
        const authHeader = request.headers.get('authorization')
        const isCronSecret = authHeader === `Bearer ${cronSecret}`
        const isVercelCron = request.headers.get('x-vercel-cron') === '1'

        const url = new URL(request.url)
        const runGenerate = url.searchParams.get('run') === 'true' || url.searchParams.get('cron') === 'true' || isVercelCron

        if (!session?.user && !isCronSecret && !isVercelCron) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
        }

        const dateParam = url.searchParams.get('date')
        const today = dateParam ? new Date(dateParam) : new Date()

        try {
          const drafts = await getUpcomingBillsDraft(today)

          if (runGenerate) {
            // Jalankan generasi tagihan (Upcoming Bills)
            const toGenerate = drafts.filter((d) => !d.exists)
            let count = 0
            const now = new Date()

            for (const draft of toGenerate) {
              await db.insert(bills).values({
                id: nanoid(),
                tenantId: draft.tenantId,
                unitId: draft.unitId,
                periodMonth: draft.periodMonth,
                periodYear: draft.periodYear,
                rentAmount: draft.rentAmount,
                electricityAmount: 0,
                waterAmount: 0,
                wifiAmount: 0,
                otherAmount: 0,
                totalAmount: draft.rentAmount,
                dueDate: draft.dueDate,
                status: 'pending',
                createdAt: now,
                updatedAt: now,
              })

              const [tenantRow] = await db
                .select({ userId: tenants.userId, propertyId: tenants.propertyId })
                .from(tenants)
                .where(eq(tenants.id, draft.tenantId))
                .limit(1)

              if (tenantRow?.userId) {
                const dueDateFormatted = new Date(draft.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                await db.insert(inbox).values({
                  id: nanoid(),
                  createdAt: now,
                  updatedAt: now,
                  userId: tenantRow.userId,
                  propertyId: tenantRow.propertyId,
                  senderId: session?.user?.id || 'system',
                  senderName: session?.user?.name || 'Sistem KostManager',
                  recipientType: 'tenant',
                  recipientPropertyId: tenantRow.propertyId,
                  recipientTenantId: draft.tenantId,
                  subject: 'Tagihan Baru Diterbitkan (Mendatang)',
                  body: `Tagihan otomatis untuk periode ${draft.periodMonth}/${draft.periodYear} sebesar Rp ${draft.rentAmount.toLocaleString('id-ID')} telah diterbitkan. Jatuh tempo: ${dueDateFormatted}.`,
                  category: 'pembayaran',
                  isRead: false,
                  readAt: null,
                  priority: 'normal',
                  status: 'unread',
                })
              }

              count++
            }

            console.log(`[Upcoming Bills] Generated ${count} bills`)
            return new Response(
              JSON.stringify({ success: true, generatedCount: count }),
              {
                status: 200,
                headers: { 'content-type': 'application/json' },
              }
            )
          }

          // Tampilkan preview draft
          return new Response(JSON.stringify(drafts), {
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

        const cronSecret = process.env.CRON_SECRET || 'local_secret'
        const authHeader = request.headers.get('authorization')
        const isCronSecret = authHeader === `Bearer ${cronSecret}`
        const isVercelCron = request.headers.get('x-vercel-cron') === '1'

        if (!session?.user && !isCronSecret && !isVercelCron) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          )
        }

        let today = new Date()
        try {
          const url = new URL(request.url)
          const dateParam = url.searchParams.get('date')
          if (dateParam) {
            today = new Date(dateParam)
          } else if (request.headers.get('content-type')?.includes('application/json')) {
            const body = await request.json()
            if (body?.date) {
              today = new Date(body.date)
            }
          }
        } catch {
          // ignore parsing error
        }

        try {
          const drafts = await getUpcomingBillsDraft(today)
          const toGenerate = drafts.filter((d) => !d.exists)

          let count = 0
          const now = new Date()

          for (const draft of toGenerate) {
            await db.insert(bills).values({
              id: nanoid(),
              tenantId: draft.tenantId,
              unitId: draft.unitId,
              periodMonth: draft.periodMonth,
              periodYear: draft.periodYear,
              rentAmount: draft.rentAmount,
              electricityAmount: 0,
              waterAmount: 0,
              wifiAmount: 0,
              otherAmount: 0,
              totalAmount: draft.rentAmount,
              dueDate: draft.dueDate,
              status: 'pending',
              createdAt: now,
              updatedAt: now,
            })

            const [tenantRow] = await db
              .select({ userId: tenants.userId, propertyId: tenants.propertyId })
              .from(tenants)
              .where(eq(tenants.id, draft.tenantId))
              .limit(1)

            if (tenantRow?.userId) {
              const dueDateFormatted = new Date(draft.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              await db.insert(inbox).values({
                id: nanoid(),
                createdAt: now,
                updatedAt: now,
                userId: tenantRow.userId,
                propertyId: tenantRow.propertyId,
                senderId: session?.user?.id || 'system',
                senderName: session?.user?.name || 'Sistem KostManager',
                recipientType: 'tenant',
                recipientPropertyId: tenantRow.propertyId,
                recipientTenantId: draft.tenantId,
                subject: 'Tagihan Baru Diterbitkan (Mendatang)',
                body: `Tagihan otomatis untuk periode ${draft.periodMonth}/${draft.periodYear} sebesar Rp ${draft.rentAmount.toLocaleString('id-ID')} telah diterbitkan. Jatuh tempo: ${dueDateFormatted}.`,
                category: 'pembayaran',
                isRead: false,
                readAt: null,
                priority: 'normal',
                status: 'unread',
              })
            }

            count++
          }

          console.log(`[Upcoming Bills] Generated ${count} bills`)

          return new Response(
            JSON.stringify({ success: true, generatedCount: count }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          )
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
