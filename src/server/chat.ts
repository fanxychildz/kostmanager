import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { chatMessages, tenants, units, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

const getOwnerTenantIds = async (ownerId: string) => {
  const ownerProperties = await db.select().from(properties).where(eq(properties.ownerId, ownerId))
  const propertyIds = ownerProperties.map((p) => p.id)
  const allTenants = await db.select().from(tenants).where(sql`${tenants.propertyId} in ${propertyIds}`)
  return allTenants.map((t) => t.id)
}

export const listChatConversations = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const tenantIds = await getOwnerTenantIds(session.user.id)

  const rows = await db
    .select({
      tenantId: chatMessages.tenantId,
      lastMessage: chatMessages.message,
      lastAt: chatMessages.createdAt,
      unread: sql<number>`SUM(CASE WHEN ${chatMessages.read} = 0 THEN 1 ELSE 0 END)`,
    })
    .from(chatMessages)
    .where(sql`${chatMessages.tenantId} in ${tenantIds}`)
    .groupBy(chatMessages.tenantId)
    .orderBy(desc(chatMessages.createdAt))

  const enriched = await Promise.all(
    rows.map(async (row) => {
      const tenant = await db.select().from(tenants).where(eq(tenants.id, row.tenantId)).then((r) => r[0])
      const unit = tenant ? await db.select().from(units).where(eq(units.id, tenant.unitId)).then((r) => r[0]) : null
      const property = tenant
        ? await db.select().from(properties).where(eq(properties.id, tenant.propertyId)).then((r) => r[0])
        : null
      return {
        tenantId: row.tenantId,
        fullName: tenant?.fullName || 'Penghuni',
        unitNumber: unit?.unitNumber || '-',
        propertyName: property?.name || '-',
        lastMessage: row.lastMessage,
        lastAt: row.lastAt,
        unread: Number(row.unread || 0),
      }
    })
  )

  return enriched
})

export const listChatMessages = createServerFn({ method: 'GET' })
  .inputValidator((d: { tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenantIds = await getOwnerTenantIds(session.user.id)
    if (!tenantIds.includes(data.tenantId)) throw new Error('Forbidden')

    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.tenantId, data.tenantId))
      .orderBy(chatMessages.createdAt)
  })

export const sendChatMessage = createServerFn({ method: 'POST' })
  .inputValidator((d: { tenantId: string; message: string; sender: 'Tenant' | 'Landlord'; senderName: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenantIds = await getOwnerTenantIds(session.user.id)
    if (!tenantIds.includes(data.tenantId)) throw new Error('Forbidden')

    const now = new Date()
    const message = await db
      .insert(chatMessages)
      .values({
        id: nanoid(),
        tenantId: data.tenantId,
        sender: data.sender,
        senderName: data.senderName,
        message: data.message,
        read: data.sender === 'Landlord',
        createdAt: now,
      })
      .returning()

    return message[0]
  })

export const markChatRead = createServerFn({ method: 'POST' })
  .inputValidator((d: { tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenantIds = await getOwnerTenantIds(session.user.id)
    if (!tenantIds.includes(data.tenantId)) throw new Error('Forbidden')

    await db
      .update(chatMessages)
      .set({ read: true })
      .where(and(eq(chatMessages.tenantId, data.tenantId), sql`${chatMessages.read} = 0`))

    return { success: true }
  })
