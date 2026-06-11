import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'
import { db } from '../db'
import { chatMessages, tenants, properties, users } from '../db/schema'
import { auth } from './auth'
import { getRequest } from '@tanstack/react-start/server'

async function requireOwner(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')
  const ownerProps = await db.select().from(properties).where(eq(properties.ownerId, session.user.id))
  return { session, propertyIds: ownerProps.map((p) => p.id) }
}

export const listChatMessages = createServerFn({ method: 'GET' })
  .inputValidator((d: { tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId)).then((r) => r[0])
    if (!tenant) throw new Error('Tenant not found')

    const isTenantUser = session.user.id === tenant.userId
    if (!isTenantUser) {
      const prop = await db.select().from(properties).where(eq(properties.id, tenant.propertyId)).then((r) => r[0])
      if (!prop || prop.ownerId !== session.user.id) throw new Error('Forbidden')
    }

    const result = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.tenantId, data.tenantId))
      .orderBy(asc(chatMessages.createdAt))
    return result
  })

export const sendChatMessage = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      tenantId: string
      message: string
      sender: 'Tenant' | 'Landlord'
      senderName: string
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId)).then((r) => r[0])
    if (!tenant) throw new Error('Tenant not found')

    if (data.sender === 'Tenant') {
      if (tenant.userId !== session.user.id) throw new Error('Forbidden')
    } else {
      const ownerProps = await db.select().from(properties).where(eq(properties.ownerId, session.user.id))
      if (!ownerProps.some((p) => p.id === tenant.propertyId)) throw new Error('Forbidden')
    }

    const now = new Date()
    const [row] = await db
      .insert(chatMessages)
      .values({
        id: crypto.randomUUID(),
        tenantId: data.tenantId,
        sender: data.sender,
        senderName: data.senderName,
        message: data.message,
        read: data.sender === 'Landlord',
        createdAt: now,
      })
      .returning()

    return row
  })

export const markChatRead = createServerFn({ method: 'POST' })
  .inputValidator((d: { tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { session } = await requireOwner(request.headers)

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId)).then((r) => r[0])
    if (!tenant) throw new Error('Tenant not found')

    const prop = await db.select().from(properties).where(eq(properties.id, tenant.propertyId)).then((r) => r[0])
    if (!prop || prop.ownerId !== session.user.id) throw new Error('Forbidden')

    await db
      .update(chatMessages)
      .set({ read: true })
      .where(and(eq(chatMessages.tenantId, data.tenantId), eq(chatMessages.read, false)))

    return { ok: true }
  })

export const listTenantChatSummaries = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const { session, propertyIds } = await requireOwner(request.headers)

  const tenantIds = await db
    .select({ id: tenants.id, propertyId: tenants.propertyId })
    .from(tenants)
    .where(sql`${tenants.propertyId} IN ${propertyIds}`)
    .then((rows) => rows.map((r) => r.id))

  if (tenantIds.length === 0) return []

  const summaries = await db
    .select()
    .from(chatMessages)
    .where(sql`${chatMessages.tenantId} IN ${tenantIds}`)
    .orderBy(desc(chatMessages.createdAt))

  return summaries
})

export const deleteMultipleChatMessages = createServerFn({ method: 'POST' })
  .inputValidator((d: { ids: string[]; tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwner(request.headers)

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId)).then((r) => r[0])
    if (!tenant) throw new Error('Tenant not found')
    if (!propertyIds.includes(tenant.propertyId ?? '')) throw new Error('Forbidden')

    if (data.ids.length === 0) return { success: true }

    await db
      .delete(chatMessages)
      .where(and(eq(chatMessages.tenantId, data.tenantId), inArray(chatMessages.id, data.ids)))

    return { success: true }
  })

export const clearChatConversation = createServerFn({ method: 'POST' })
  .inputValidator((d: { tenantId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwner(request.headers)

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId)).then((r) => r[0])
    if (!tenant) throw new Error('Tenant not found')
    if (!propertyIds.includes(tenant.propertyId ?? '')) throw new Error('Forbidden')

    await db
      .delete(chatMessages)
      .where(eq(chatMessages.tenantId, data.tenantId))

    return { success: true }
  })
