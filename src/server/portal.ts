import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { tenants, units, properties, bills, users } from '../db/schema'
import { auth } from './auth'
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
