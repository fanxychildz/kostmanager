import { createServerFn } from '@tanstack/react-start'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { maintenanceRequests, maintenanceUpdates, users, properties, tenants, units } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

function parseStatus(value: unknown): 'pending' | 'in_progress' | 'resolved' | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (['pending', 'in_progress', 'resolved'].includes(normalized as any)) return normalized as any
  return undefined
}

async function requireOwnerProperties(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProps: {
    id: string
  }[] = await db.select({ id: properties.id }).from(properties).where(eq(properties.ownerId, session.user.id))

  const ownerRow = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return {
    session,
    propertyIds: ownerProps.map((p) => p.id),
    userId: session.user.id,
    userName: ownerRow[0]?.name || 'Pengelola Kost',
  }
}

export const listMaintenanceRequests = createServerFn({ method: 'GET' })
  .inputValidator((d: { status?: string | undefined; propertyId?: string | undefined } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwnerProperties(request.headers)
    if (propertyIds.length === 0) return []

    const conditions = [inArray(maintenanceRequests.propertyId, propertyIds)] as any[]
    let status = data?.status
    const normalizedStatus = parseStatus(status)
    if (status && normalizedStatus) conditions.push(eq(maintenanceRequests.status, normalizedStatus))

    const propertyId = data?.propertyId
    if (propertyId) conditions.push(eq(maintenanceRequests.propertyId, propertyId))

    const rows = await db
      .select({
        id: maintenanceRequests.id,
        tenantId: maintenanceRequests.tenantId,
        propertyId: maintenanceRequests.propertyId,
        unitId: maintenanceRequests.unitId,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        category: maintenanceRequests.category,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        photoUrl: maintenanceRequests.photoUrl,
        repairCost: maintenanceRequests.repairCost,
        createdAt: maintenanceRequests.createdAt,
        updatedAt: maintenanceRequests.updatedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
        propertyName: properties.name,
      })
      .from(maintenanceRequests)
      .leftJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
      .leftJoin(units, eq(maintenanceRequests.unitId, units.id))
      .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(and(...conditions))
      .orderBy(sql`${maintenanceRequests.createdAt} DESC`)

    return rows as any
  })

export const getMaintenanceRequest = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)
    const { id } = data

    const result = await db
      .select({
        id: maintenanceRequests.id,
        tenantId: maintenanceRequests.tenantId,
        propertyId: maintenanceRequests.propertyId,
        unitId: maintenanceRequests.unitId,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        category: maintenanceRequests.category,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        photoUrl: maintenanceRequests.photoUrl,
        repairCost: maintenanceRequests.repairCost,
        createdAt: maintenanceRequests.createdAt,
        updatedAt: maintenanceRequests.updatedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
        propertyName: properties.name,
      })
      .from(maintenanceRequests)
      .leftJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
      .leftJoin(units, eq(maintenanceRequests.unitId, units.id))
      .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(and(eq(maintenanceRequests.id, id), inArray(maintenanceRequests.propertyId, propertyIds)))
      .limit(1)

    if (result.length === 0) throw new Error('Not found: Permintaan perbaikan tidak ditemukan')

    const updates = await db.select().from(maintenanceUpdates).where(eq(maintenanceUpdates.requestId, id))
    const base = result[0]
    const resolvedAt = base.status === 'resolved' ? (base as any).updatedAt ?? null : null

    return {
      ...base,
      updates: updates.sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0)),
      resolvedAt,
    } as any
  })

export const createMaintenanceRequest = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      propertyId: string
      unitId: string
      title: string
      description: string
      category: string
      priority: string
      photoUrl?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const now = new Date()
    const [result] = await db
      .insert(maintenanceRequests)
      .values({
        id: nanoid(),
        tenantId: null,
        propertyId: data.propertyId,
        unitId: data.unitId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        photoUrl: data.photoUrl ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return result as any
  })

export const updateMaintenanceStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      id: string
      status: 'pending' | 'in_progress' | 'resolved'
      noteText?: string | null
      repairCost?: number | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const { propertyIds, userId, userName } = await requireOwnerProperties(getRequest().headers)

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.id, data.id), inArray(maintenanceRequests.propertyId, propertyIds)))
      .limit(1)

    if (!existing) throw new Error('Not found: Permintaan perbaikan tidak ditemukan')

    const now = new Date()
    const updateData: Record<string, any> = {
      status: data.status,
      updatedAt: now,
    }

    if (data.status === 'resolved') updateData.resolvedAt = now
    if (typeof data.repairCost === 'number') updateData.repairCost = data.repairCost

    await db.update(maintenanceRequests).set(updateData).where(eq(maintenanceRequests.id, data.id))

    const normalizedNote = (data.noteText || '').trim() || `Status diperbarui menjadi ${data.status.replace('_', ' ')}`
    await db.insert(maintenanceUpdates).values({
      id: nanoid(),
      requestId: data.id,
      authorId: userId,
      authorName: userName,
      text: normalizedNote,
      createdAt: now,
    })

    const [updated] = await db
      .select({
        id: maintenanceRequests.id,
        tenantId: maintenanceRequests.tenantId,
        propertyId: maintenanceRequests.propertyId,
        unitId: maintenanceRequests.unitId,
        title: maintenanceRequests.title,
        description: maintenanceRequests.description,
        category: maintenanceRequests.category,
        priority: maintenanceRequests.priority,
        status: maintenanceRequests.status,
        photoUrl: maintenanceRequests.photoUrl,
        repairCost: maintenanceRequests.repairCost,
        createdAt: maintenanceRequests.createdAt,
        updatedAt: maintenanceRequests.updatedAt,
        resolvedAt: maintenanceRequests.resolvedAt,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
        propertyName: properties.name,
      })
      .from(maintenanceRequests)
      .leftJoin(tenants, eq(maintenanceRequests.tenantId, tenants.id))
      .leftJoin(units, eq(maintenanceRequests.unitId, units.id))
      .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(eq(maintenanceRequests.id, data.id))
      .limit(1)
    return updated as any
  })

export const addMaintenanceUpdate = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      id: string
      text: string
      authorName?: string
    }) => d,
  )
  .handler(async ({ data }) => {
    const { propertyIds, userId, userName } = await requireOwnerProperties(getRequest().headers)

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.id, data.id), inArray(maintenanceRequests.propertyId, propertyIds)))
      .limit(1)

    if (!existing) throw new Error('Not found: Permintaan perbaikan tidak ditemukan')

    const now = new Date()
    const [result] = await db
      .insert(maintenanceUpdates)
      .values({
        id: nanoid(),
        requestId: data.id,
        authorId: userId,
        authorName: (data.authorName || '').trim() || userName,
        text: data.text,
        createdAt: now,
      })
      .returning()

    await db.update(maintenanceRequests).set({ updatedAt: now }).where(eq(maintenanceRequests.id, data.id))
    return result as any
  })

export const deleteMaintenanceRequest = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)
    const { id } = data

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(and(eq(maintenanceRequests.id, id), inArray(maintenanceRequests.propertyId, propertyIds)))
      .limit(1)

    if (!existing) throw new Error('Not found: Permintaan perbaikan tidak ditemukan')

    await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id))
    return { success: true }
  })

export const deleteMultipleMaintenanceRequests = createServerFn({ method: 'POST' })
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data }) => {
    const { propertyIds } = await requireOwnerProperties(getRequest().headers)
    const { ids } = data

    if (ids.length === 0) return { success: true }

    await db
      .delete(maintenanceRequests)
      .where(and(inArray(maintenanceRequests.id, ids), inArray(maintenanceRequests.propertyId, propertyIds)))

    return { success: true }
  })


