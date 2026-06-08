import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { bills, tenants, units, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listBills = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, session.user.id))

  const propertyIds = ownerProperties.map((p) => p.id)

  const allBills = await db.select().from(bills)
  const allTenants = await db.select().from(tenants)
  const allUnits = await db.select().from(units)

  const filtered = allBills
    .filter((b) => {
      const tenant = allTenants.find((t) => t.id === b.tenantId)
      return tenant && propertyIds.includes(tenant.propertyId)
    })
    .map((b) => {
      const tenant = allTenants.find((t) => t.id === b.tenantId)
      const unit = allUnits.find((u) => u.id === b.unitId)
      return {
        ...b,
        tenantName: tenant?.fullName,
        unitNumber: unit?.unitNumber,
      }
    })

  return filtered
})

export const getBill = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select().from(bills).where(eq(bills.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    const tenant = await db.select().from(tenants).where(eq(tenants.id, result[0].tenantId))
    if (tenant.length === 0) throw new Error('Not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, tenant[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    const unit = await db.select().from(units).where(eq(units.id, result[0].unitId))

    return {
      ...result[0],
      tenantName: tenant[0].fullName,
      unitNumber: unit[0]?.unitNumber,
    }
  })

export const createBill = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    tenantId: string
    unitId: string
    periodMonth: number
    periodYear: number
    rentAmount: number
    electricityAmount?: number
    waterAmount?: number
    wifiAmount?: number
    otherAmount?: number
    dueDate: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const tenant = await db.select().from(tenants).where(eq(tenants.id, data.tenantId))
    if (tenant.length === 0) throw new Error('Tenant not found')

    const prop = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, tenant[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Property not found')

    const totalAmount =
      data.rentAmount +
      (data.electricityAmount || 0) +
      (data.waterAmount || 0) +
      (data.wifiAmount || 0) +
      (data.otherAmount || 0)

    const now = new Date()
    const result = await db.insert(bills).values({
      id: nanoid(),
      tenantId: data.tenantId,
      unitId: data.unitId,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      rentAmount: data.rentAmount,
      electricityAmount: data.electricityAmount || 0,
      waterAmount: data.waterAmount || 0,
      wifiAmount: data.wifiAmount || 0,
      otherAmount: data.otherAmount || 0,
      totalAmount,
      dueDate: new Date(data.dueDate),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning()

    return result[0]
  })

export const updateBill = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    id: string
    rentAmount?: number
    electricityAmount?: number
    waterAmount?: number
    wifiAmount?: number
    otherAmount?: number
    dueDate?: string
    status?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select().from(bills).where(eq(bills.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const updatePayload: any = { ...updateData, updatedAt: new Date() }
    if (updateData.dueDate) updatePayload.dueDate = new Date(updateData.dueDate)

    if (updateData.rentAmount !== undefined || updateData.electricityAmount !== undefined || updateData.waterAmount !== undefined || updateData.wifiAmount !== undefined || updateData.otherAmount !== undefined) {
      updatePayload.totalAmount =
        (updateData.rentAmount ?? existing[0].rentAmount) +
        (updateData.electricityAmount ?? existing[0].electricityAmount) +
        (updateData.waterAmount ?? existing[0].waterAmount) +
        (updateData.wifiAmount ?? existing[0].wifiAmount) +
        (updateData.otherAmount ?? existing[0].otherAmount)
    }

    const result = await db
      .update(bills)
      .set(updatePayload)
      .where(eq(bills.id, id))
      .returning()

    return result[0]
  })

export const deleteBill = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select().from(bills).where(eq(bills.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(bills).where(eq(bills.id, data.id))
    return { success: true }
  })
