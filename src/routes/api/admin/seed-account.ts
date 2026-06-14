import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { users, properties, units } from '~/db/schema'
import { auth } from '~/server/auth'
import { nanoid } from 'nanoid'

export const Route = createFileRoute('/api/admin/seed-account')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get('x-admin-secret')
        if (secret !== process.env.ADMIN_SEED_SECRET) {
          return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 })
        }

        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user || session.user.role !== 'owner') {
          return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 })
        }

        const owner = await db.select().from(users).where(eq(users.email, session.user.email)).then(r => r[0])
        if (!owner) {
          return new Response(JSON.stringify({ ok: false, error: 'owner not found' }), { status: 404 })
        }

        const now = new Date()
        const propertiesRows = await db.select().from(properties).where(eq(properties.ownerId, owner.id))
        const prop = propertiesRows[0]
        if (!prop) {
          await db.insert(properties).values({ id: nanoid(), ownerId: owner.id, name: 'Properti Baru', address: '-', city: '-', province: '-', type: 'kost', createdAt: now, updatedAt: now }).returning()
        }

        const selectedProp = prop || await db.select().from(properties).where(eq(properties.ownerId, owner.id)).then(r => r[0])
        const unitsRows = await db.select().from(units).where(eq(units.propertyId, selectedProp.id))
        const unit = unitsRows[0]
        if (!unit) {
          await db.insert(units).values({ id: nanoid(), propertyId: selectedProp.id, unitNumber: '1', type: 'Standard', priceMonthly: 1000000, status: 'available', facilities: [], createdAt: now, updatedAt: now }).returning()
        }

        return new Response(JSON.stringify({ ok: true, owner: owner.email }), { headers: { 'content-type': 'application/json' } })
      },
    },
  },
})
