import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { units, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listUnits = createServerFn({ method: 'GET' })
  .inputValidator((d: { propertyId?: string } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const ownerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.ownerId, session.user.id))

    const propertyIds = ownerProperties.map((p) => p.id)

    let query = db.select().from(units)
    if (data?.propertyId && propertyIds.includes(data.propertyId)) {
      query = query.where(eq(units.propertyId, data.propertyId)) as typeof query
    }

    const result = await query
    return result.filter((u) => propertyIds.includes(u.propertyId))
  })

export const getUnit = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select().from(units).where(eq(units.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
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
      .select()
      .from(properties)
      .where(and(eq(properties.id, data.propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Property not found')

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
    }).returning()

    return result[0]
  })

export const updateUnit = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string; unitNumber?: string; type?: string; priceMonthly?: number; status?: string; facilities?: string[] }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select().from(units).where(eq(units.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
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
      .returning()

    return result[0]
  })

export const deleteUnit = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select().from(units).where(eq(units.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, existing[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    await db.delete(units).where(eq(units.id, data.id))
    return { success: true }
  })
