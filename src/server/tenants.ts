import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { tenants, units, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listTenants = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, session.user.id))

  const propertyIds = ownerProperties.map((p) => p.id)

  const result = await db.select().from(tenants)
  const filtered = result.filter((t) => propertyIds.includes(t.propertyId))

  return filtered
})

export const getTenant = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select().from(tenants).where(eq(tenants.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, result[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    return result[0]
  })

export const createTenant = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    unitId: string
    fullName: string
    ktpNumber: string
    ktpPhotoUrl?: string
    phone: string
    email: string
    occupation?: string
    checkInDate: string
    checkOutDate?: string
    depositAmount?: number
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const unit = await db.select().from(units).where(eq(units.id, data.unitId))
    if (unit.length === 0) throw new Error('Unit not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, unit[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Property not found')

    const now = new Date()
    const result = await db.insert(tenants).values({
      id: nanoid(),
      unitId: data.unitId,
      propertyId: unit[0].propertyId,
      fullName: data.fullName,
      ktpNumber: data.ktpNumber,
      ktpPhotoUrl: data.ktpPhotoUrl || null,
      phone: data.phone,
      email: data.email,
      occupation: data.occupation || null,
      checkInDate: new Date(data.checkInDate),
      checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : null,
      depositAmount: data.depositAmount || 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).returning()

    await db.update(units).set({ status: 'occupied', updatedAt: now }).where(eq(units.id, data.unitId))

    return result[0]
  })

export const updateTenant = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    id: string
    fullName?: string
    ktpNumber?: string
    ktpPhotoUrl?: string
    phone?: string
    email?: string
    occupation?: string
    checkInDate?: string
    checkOutDate?: string
    depositAmount?: number
    status?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select().from(tenants).where(eq(tenants.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, existing[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    const updatePayload: any = { ...updateData, updatedAt: new Date() }
    if (updateData.checkInDate) updatePayload.checkInDate = new Date(updateData.checkInDate)
    if (updateData.checkOutDate) updatePayload.checkOutDate = new Date(updateData.checkOutDate)

    const result = await db
      .update(tenants)
      .set(updatePayload)
      .where(eq(tenants.id, id))
      .returning()

    if (updateData.status === 'inactive' && existing[0].status === 'active') {
      await db.update(units).set({ status: 'available', updatedAt: new Date() }).where(eq(units.id, existing[0].unitId))
    }

    return result[0]
  })

export const deleteTenant = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select().from(tenants).where(eq(tenants.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, existing[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    if (existing[0].status === 'active') {
      await db.update(units).set({ status: 'available', updatedAt: new Date() }).where(eq(units.id, existing[0].unitId))
    }

    await db.delete(tenants).where(eq(tenants.id, data.id))
    return { success: true }
  })
