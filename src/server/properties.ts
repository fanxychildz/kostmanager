import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { properties, units } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listProperties = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, session.user.id))

  const withCounts = await Promise.all(
    result.map(async (prop) => {
      const allUnits = await db.select().from(units).where(eq(units.propertyId, prop.id))
      return {
        ...prop,
        totalUnits: allUnits.length,
        occupiedUnits: allUnits.filter((u) => u.status === 'occupied').length,
      }
    })
  )

  return withCounts
})

export const getProperty = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, data.id), eq(properties.ownerId, session.user.id)))

    if (result.length === 0) throw new Error('Not found')

    const allUnits = await db.select().from(units).where(eq(units.propertyId, data.id))

    return {
      ...result[0],
      totalUnits: allUnits.length,
      occupiedUnits: allUnits.filter((u) => u.status === 'occupied').length,
    }
  })

export const createProperty = createServerFn({ method: 'POST' })
  .inputValidator((d: { name: string; address: string; city: string; province: string; type: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const now = new Date()

    const result = await db.insert(properties).values({
      id: nanoid(),
      ownerId: session.user.id,
      name: data.name,
      address: data.address,
      city: data.city,
      province: data.province,
      type: data.type as 'kost' | 'kontrakan' | 'apartemen',
      createdAt: now,
      updatedAt: now,
    }).returning()

    return result[0]
  })

export const updateProperty = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string; name?: string; address?: string; city?: string; province?: string; type?: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const result = await db
      .update(properties)
      .set({
        ...updateData,
        type: updateData.type as 'kost' | 'kontrakan' | 'apartemen' | undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(properties.id, id), eq(properties.ownerId, session.user.id)))
      .returning()

    if (result.length === 0) throw new Error('Not found')

    return result[0]
  })

export const deleteProperty = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db
      .delete(properties)
      .where(and(eq(properties.id, data.id), eq(properties.ownerId, session.user.id)))
      .returning()

    if (result.length === 0) throw new Error('Not found')

    return { success: true }
  })
