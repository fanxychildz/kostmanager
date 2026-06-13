import { createServerFn } from '@tanstack/react-start'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { db } from '../db'
import { inbox, properties, tenants, users } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

async function getCurrentUser(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const user = (await db
    .select({ id: users.id, name: users.name, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1))[0]
  if (!user) throw new Error('Unauthorized')

  return { session, user }
}

export const listInbox = createServerFn({ method: 'GET' })
  .inputValidator((d: { propertyId?: string | undefined; category?: string | undefined; isRead?: boolean | undefined } | undefined) => d)
  .handler(async ({ data }) => {
    const { user } = await getCurrentUser(getRequest().headers)

    const conditions = [eq(inbox.userId, user.id)] as any[]
    if (data?.propertyId) conditions.push(eq(inbox.propertyId, data.propertyId))
    if (data?.category) conditions.push(eq(inbox.category, data.category as any))
    if (data?.isRead !== undefined) conditions.push(eq(inbox.isRead, data.isRead))

    const items = await db.select().from(inbox).where(and(...conditions)).orderBy(sql`${inbox.createdAt} DESC`).limit(50)

    return items
  })

export const getInboxCount = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { user } = await getCurrentUser(getRequest().headers)

    const result = await db.select({ count: sql<number>`count(*)` }).from(inbox).where(and(eq(inbox.userId, user.id), eq(inbox.isRead, false)))

    return { count: Number((result[0]?.count as any) || 0) }
  })

export const getInboxMessage = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { user } = await getCurrentUser(getRequest().headers)

    const result = await db.select().from(inbox).where(and(eq(inbox.id, data.id), eq(inbox.userId, user.id))).limit(1)
    if (result.length === 0) throw new Error('Not found')

    return result[0]
  })

export const createInbox = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      propertyId: string
      subject: string
      body: string
      category?: 'pengumuman' | 'chat' | 'pembayaran' | 'laporan' | 'lainnya'
      priority?: 'normal' | 'penting'
      recipientType?: 'owner' | 'tenant'
      recipientTenantId?: string
    }) => d,
  )
  .handler(async ({ data }) => {
    const { user } = await getCurrentUser(getRequest().headers)
    const now = new Date()

    await db.insert(inbox).values({
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      userId: user.id,
      propertyId: data.propertyId,
      senderId: user.id,
      senderName: user.name,
      recipientType: (data.recipientType || 'owner') as any,
      recipientPropertyId: data.propertyId,
      recipientTenantId: data.recipientTenantId || null,
      subject: data.subject,
      body: data.body,
      category: (data.category || 'lainnya') as any,
      isRead: false,
      readAt: null,
      priority: (data.priority || 'normal') as any,
      status: 'unread',
    })

    return { success: true }
  })

export const markInboxRead = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { user } = await getCurrentUser(getRequest().headers)

    const existing = await db.select().from(inbox).where(and(eq(inbox.id, data.id), eq(inbox.userId, user.id))).limit(1)
    if (existing.length === 0) throw new Error('Not found')

    const now = new Date()
    await db.update(inbox).set({ isRead: true, readAt: now, updatedAt: now, status: 'read' }).where(eq(inbox.id, data.id))

    return { success: true }
  })

export const markAllInboxRead = createServerFn({ method: 'POST' })
  .handler(async () => {
    const { user } = await getCurrentUser(getRequest().headers)

    await db.update(inbox).set({ isRead: true, readAt: new Date(), updatedAt: new Date(), status: 'read' }).where(and(eq(inbox.userId, user.id), eq(inbox.isRead, false)))

    return { success: true }
  })

export const deleteInbox = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { user } = await getCurrentUser(getRequest().headers)

    const existing = await db.select().from(inbox).where(and(eq(inbox.id, data.id), eq(inbox.userId, user.id))).limit(1)
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(inbox).where(eq(inbox.id, data.id))
    return { success: true }
  })
