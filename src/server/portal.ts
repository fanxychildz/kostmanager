import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { tenants, units, properties, bills, users, maintenanceRequests, maintenanceUpdates, notifications } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'

function forwardAuthCookies(headers: Headers) {
  const cookies = headers.getSetCookie()
  if (cookies.length === 0) return
  setResponseHeader('set-cookie', cookies.length === 1 ? cookies[0] : cookies)
}

// Resolve the tenant record linked to the current session user.
async function requireTenant(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const result = await db.select().from(tenants).where(eq(tenants.userId, session.user.id))
  if (result.length === 0) throw new Error('Akun ini bukan penghuni')

  return result[0]
}

// Tenant self-registration: the owner must have already added them (by email),
// then the tenant claims that record with a password. No email is sent.
export const portalRegister = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()

    const existingTenant = await db.select().from(tenants).where(eq(tenants.email, data.email))
    if (existingTenant.length === 0) {
      throw new Error('Email tidak terdaftar sebagai penghuni. Hubungi pemilik kost Anda.')
    }
    if (existingTenant[0].userId) {
      throw new Error('Akun untuk email ini sudah terdaftar. Silakan masuk.')
    }

    const tenant = existingTenant[0]

    const { headers, response } = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: tenant.fullName,
      },
      headers: request.headers,
      returnHeaders: true,
    })
    forwardAuthCookies(headers)

    const userId = response.user.id

    const now = new Date()
    // Mark the account as a tenant (role defaults to 'owner' on sign-up) and
    // link it to the tenant record.
    await db.update(users).set({ role: 'tenant', updatedAt: now }).where(eq(users.id, userId))
    await db.update(tenants).set({ userId, updatedAt: now }).where(eq(tenants.id, tenant.id))

    return { success: true }
  })

export const getPortalProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const tenant = await requireTenant(request.headers)

  const unit = await db.select().from(units).where(eq(units.id, tenant.unitId))
  const property = await db.select().from(properties).where(eq(properties.id, tenant.propertyId))

  return {
    tenant,
    unit: unit[0] ?? null,
    property: property[0] ?? null,
  }
})

export const getPortalBills = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const tenant = await requireTenant(request.headers)

  const result = await db.select().from(bills).where(eq(bills.tenantId, tenant.id))

  return result.sort((a, b) => {
    if (b.periodYear !== a.periodYear) return b.periodYear - a.periodYear
    return b.periodMonth - a.periodMonth
  })
})

export const listPortalMaintenanceRequests = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const tenant = await requireTenant(request.headers)
    
    const results = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.tenantId, tenant.id))
      
    const requestsWithUpdates = await Promise.all(
      results.map(async (req) => {
        const updates = await db
          .select()
          .from(maintenanceUpdates)
          .where(eq(maintenanceUpdates.requestId, req.id))
        
        return {
          ...req,
          updates: updates.sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0))
        }
      })
    )
    
    return requestsWithUpdates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as any
  })

export const createPortalMaintenanceRequest = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      title: string
      description: string
      category: string
      priority: string
      photoUrl?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const tenant = await requireTenant(request.headers)

    const now = new Date()
    const requestId = nanoid()

    const [result] = await db
      .insert(maintenanceRequests)
      .values({
        id: requestId,
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        photoUrl: data.photoUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await db.insert(maintenanceUpdates).values({
      id: nanoid(),
      requestId: requestId,
      authorId: tenant.userId!,
      authorName: tenant.fullName,
      text: `Tiket keluhan berhasil dibuat. Pelapor: ${tenant.fullName}.`,
      createdAt: now,
    })

    // Notify owner about new maintenance request
    if (tenant.propertyId) {
      const ownerResult = await db
        .select()
        .from(users)
        .where(eq(users.id, (await db.select().from(properties).where(eq(properties.id, tenant.propertyId)).limit(1))[0].ownerId))
        .limit(1)

      if (ownerResult[0]?.id) {
        await db.insert(notifications).values({
          id: nanoid(),
          recipientId: ownerResult[0].id,
          recipientType: 'owner',
          channel: 'in_app',
          type: 'announcement',
          subject: 'Keluhan Baru',
          messageContent: `Ada keluhan baru dari ${tenant.fullName}: ${data.title}`,
          status: 'delivered',
          createdAt: now,
        })
      }
    }

    return result as any
  })

