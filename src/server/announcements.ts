import { createServerFn } from '@tanstack/react-start'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { announcements, properties, users, tenants } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

async function requireOwnerProperties(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProps: { id: string }[] = await db.select({ id: properties.id }).from(properties).where(eq(properties.ownerId, session.user.id))

  return {
    session,
    propertyIds: ownerProps.map((p) => p.id),
    userId: session.user.id,
    userName: session.user.name || 'Pengelola Kost',
  }
}

async function requireRecipient(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const user: typeof users.$inferSelect | undefined = (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0]
  if (!user) throw new Error('Unauthorized')

  return {
    session,
    role: user.role,
    userId: user.id,
    userName: user.name,
  }
}

export const listOwnerAnnouncements = createServerFn({ method: 'GET' })
  .inputValidator((d: { propertyId?: string | undefined; audience?: string | undefined; page?: number | undefined; limit?: number | undefined } | undefined) => d)
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)
    if (propertyIds.length === 0) return { items: [], total: 0, page: data?.page || 1, limit: data?.limit || 20 }

    const conditions = [inArray(announcements.propertyId, propertyIds)] as any[]
    if (data?.propertyId) conditions.push(eq(announcements.propertyId, data.propertyId))
    if (data?.audience) conditions.push(eq(announcements.audience, data.audience as any))

    const baseQuery = db.select().from(announcements).where(and(...conditions))
    const page = Math.max(1, (data?.page as number) || 1)
    const limit = Math.max(1, Math.min(100, (data?.limit as number) || 20))
    const offset = (page - 1) * limit

    const countRow = await db.select({ count: sql<number>`count(*)` }).from(announcements).where(and(...conditions))
    const items = await baseQuery.orderBy(sql`${announcements.createdAt} DESC`).limit(limit).offset(offset)

    return { items: items as any[], total: Number((countRow[0]?.count as any) || 0), page, limit }
  })

export const getAnnouncement = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)

    const result = await db.select().from(announcements).where(and(eq(announcements.id, data.id), inArray(announcements.propertyId, propertyIds))).limit(1)

    if (result.length === 0) throw new Error('Not found: Pengumuman tidak ditemukan')

    return result[0]
  })

export const createAnnouncement = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      propertyId: string
      title: string
      body: string
      channel: 'owner' | 'tenant' | 'all'
      audience: 'all' | 'property' | 'unit' | 'tenant'
      targetTenantId?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)

    if (!propertyIds.includes(data.propertyId)) {
      throw new Error('Forbidden: Properti tidak sesuai')
    }

    const now = new Date()
    const [result] = await db.insert(announcements).values({ id: nanoid(), ...data, createdAt: now, updatedAt: now }).returning()

    return result as any
  })

export const updateAnnouncement = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      id: string
      title?: string
      body?: string
      channel?: 'owner' | 'tenant' | 'all'
      audience?: 'all' | 'property' | 'unit' | 'tenant'
      targetTenantId?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)

    const existing = await db.select().from(announcements).where(and(eq(announcements.id, data.id), inArray(announcements.propertyId, propertyIds))).limit(1)

    if (existing.length === 0) throw new Error('Not found: Pengumuman tidak ditemukan')

    const updatePayload: any = { ...data, updatedAt: new Date() }
    delete updatePayload.id

    const [result] = await db.update(announcements).set(updatePayload).where(eq(announcements.id, data.id)).returning()

    return result as any
  })

export const deleteAnnouncement = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { propertyIds, userId } = await requireOwnerProperties(getRequest().headers)

    const existing = await db.select().from(announcements).where(and(eq(announcements.id, data.id), inArray(announcements.propertyId, propertyIds))).limit(1)

    if (existing.length === 0) throw new Error('Not found: Pengumuman tidak ditemukan')

    await db.delete(announcements).where(eq(announcements.id, data.id))
    return { success: true }
  })

export const listTenantAnnouncements = createServerFn({ method: 'GET' })
  .inputValidator((d: { page?: number | undefined; limit?: number | undefined } | undefined) => d)
  .handler(async ({ data }) => {
    const recipient = await requireRecipient(getRequest().headers)

    if (recipient.role !== 'tenant') {
      throw new Error('Forbidden')
    }

    const tenantRow = (await db.select().from(tenants).where(eq(tenants.userId, recipient.userId)).limit(1))[0]
    if (!tenantRow) return { items: [], total: 0, page: 1, limit: 20 }

    const page = Math.max(1, (data?.page as number) || 1)
    const limit = Math.max(1, Math.min(100, (data?.limit as number) || 20))
    const offset = (page - 1) * limit

    const conditions = [
      and(
        eq(announcements.propertyId, tenantRow.propertyId),
        sql`(${announcements.audience} = 'all' OR ${announcements.audience} = 'property')`,
      ),
    ] as any[]

    const countRow = await db.select({ count: sql<number>`count(*)` }).from(announcements).where(and(...conditions))
    const items = await db.select().from(announcements).where(and(...conditions)).orderBy(sql`${announcements.createdAt} DESC`).limit(limit).offset(offset)

    return { items: items as any[], total: Number((countRow[0]?.count as any) || 0), page, limit }
  })
