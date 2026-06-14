import { createServerFn } from '@tanstack/react-start'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db'
import { units, properties, users } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

// Explicit column selectors to avoid SELECT * hitting missing columns in production DB
const unitFields = {
  id: units.id,
  propertyId: units.propertyId,
  unitNumber: units.unitNumber,
  type: units.type,
  priceMonthly: units.priceMonthly,
  status: units.status,
  facilities: units.facilities,
  createdAt: units.createdAt,
  updatedAt: units.updatedAt,
}

export const listUnits = createServerFn({ method: 'GET' })
  .inputValidator((d: { propertyId?: string } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id))

    const propertyIds = ownerProperties.map((p) => p.id)
    if (propertyIds.length === 0) return []

    let baseQuery = db.select(unitFields).from(units)

    if (data?.propertyId && propertyIds.includes(data.propertyId)) {
      const result = await (baseQuery as any).where(eq(units.propertyId, data.propertyId))
      return result
    }

    const result = await baseQuery
    return result.filter((u) => propertyIds.includes(u.propertyId))
  })

export const getUnit = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select(unitFields).from(units).where(eq(units.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, result[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    return result[0]
  })

export const createUnit = createServerFn({ method: 'POST' })
  .inputValidator((d: { propertyId: string; unitNumber: string; type: string; priceMonthly: number; status?: string; facilities?: string[] }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, data.propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Property not found')

    // Enforce pricing plan unit limits
    const owner = await db.select().from(users).where(eq(users.id, session.user.id)).then(r => r[0])
    if (!owner) throw new Error('Owner profile not found')

    const existingUnitsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .innerJoin(properties, eq(properties.id, units.propertyId))
      .where(eq(properties.ownerId, session.user.id))
      .then(r => r[0]?.count || 0)

    if (!owner.subscriptionExpiresAt) {
      // Free / Gratis Plan: limit 10 units
      if (existingUnitsCount >= 10) {
        throw new Error('Batas Unit Terlampaui: Paket Gratis hanya mendukung maksimal 10 unit kamar. Silakan lakukan upgrade ke Paket Pro pada menu Pengaturan > Billing untuk mengelola hingga 100 unit.')
      }
    } else {
      // Pro Plan: limit 100 units
      if (existingUnitsCount >= 100) {
        throw new Error('Batas Unit Terlampaui: Paket Pro hanya mendukung maksimal 100 unit kamar. Silakan hubungi Sales untuk upgrade ke Paket Bisnis.')
      }
    }

    const now = new Date()
    const result = await db.insert(units).values({
      id: nanoid(),
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      type: data.type,
      priceMonthly: data.priceMonthly,
      status: (data.status || 'available') as 'available' | 'occupied' | 'maintenance',
      facilities: data.facilities || [],
      createdAt: now,
      updatedAt: now,
    }).returning({ ...unitFields })

    return result[0]
  })

export const updateUnit = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string; unitNumber?: string; type?: string; priceMonthly?: number; status?: string; facilities?: string[] }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select(unitFields).from(units).where(eq(units.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, existing[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    const result = await db
      .update(units)
      .set({
        ...updateData,
        status: updateData.status as 'available' | 'occupied' | 'maintenance' | undefined,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning({ ...unitFields })

    return result[0]
  })

export const deleteUnit = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select({ id: units.id, propertyId: units.propertyId }).from(units).where(eq(units.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, existing[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    await db.delete(units).where(eq(units.id, data.id))
    return { success: true }
  })
