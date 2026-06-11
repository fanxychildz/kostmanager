import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { notifications } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listNotifications = createServerFn({ method: 'GET' })
  .inputValidator((d: { recipientType?: string | undefined; channel?: string | undefined } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const query = await db.select().from(notifications).where(eq(notifications.recipientId, session.user.id)) as any

    let filtered = query
    if (data?.recipientType) {
      filtered = filtered.filter((n: any) => n.recipientType === data.recipientType)
    }
    if (data?.channel) {
      filtered = filtered.filter((n: any) => n.channel === data.channel)
    }

    return filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  })

export const getNotification = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select().from(notifications).where(eq(notifications.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    return result[0]
  })

export const createNotification = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    recipientType: string
    recipientId: string
    channel: string
    type: string
    relatedBillId?: string
    subject?: string
    messageContent: string
    status?: string
    sentAt?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const now = new Date()
    const result = await db.insert(notifications).values({
      id: nanoid(),
      recipientType: data.recipientType as any,
      recipientId: data.recipientId,
      channel: data.channel as any,
      type: data.type as any,
      relatedBillId: data.relatedBillId || null,
      subject: data.subject || null,
      messageContent: data.messageContent,
      status: (data.status || 'queued') as any,
      sentAt: data.sentAt ? new Date(data.sentAt) : null,
      createdAt: now,
    }).returning()

    return result[0]
  })

export const updateNotification = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    id: string
    status?: string
    sentAt?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select().from(notifications).where(eq(notifications.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const updatePayload: any = { ...updateData }
    if (updateData.sentAt) updatePayload.sentAt = new Date(updateData.sentAt)

    const result = await db
      .update(notifications)
      .set(updatePayload)
      .where(eq(notifications.id, id))
      .returning()

    return result[0]
  })

export const deleteNotification = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select().from(notifications).where(eq(notifications.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(notifications).where(eq(notifications.id, data.id))
    return { success: true }
  })
