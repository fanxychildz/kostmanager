import { createServerFn } from '@tanstack/react-start'
import { eq, and, inArray, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { bills, tenants, units, properties, inbox } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

// Explicit column selectors to avoid SELECT * hitting missing columns in production DB
const billFields = {
  id: bills.id,
  tenantId: bills.tenantId,
  unitId: bills.unitId,
  periodMonth: bills.periodMonth,
  periodYear: bills.periodYear,
  rentAmount: bills.rentAmount,
  electricityAmount: bills.electricityAmount,
  waterAmount: bills.waterAmount,
  wifiAmount: bills.wifiAmount,
  otherAmount: bills.otherAmount,
  totalAmount: bills.totalAmount,
  dueDate: bills.dueDate,
  status: bills.status,
  createdAt: bills.createdAt,
  updatedAt: bills.updatedAt,
}

const tenantFields = {
  id: tenants.id,
  userId: tenants.userId,
  unitId: tenants.unitId,
  propertyId: tenants.propertyId,
  fullName: tenants.fullName,
  ktpNumber: tenants.ktpNumber,
  ktpPhotoUrl: tenants.ktpPhotoUrl,
  phone: tenants.phone,
  email: tenants.email,
  occupation: tenants.occupation,
  checkInDate: tenants.checkInDate,
  checkOutDate: tenants.checkOutDate,
  depositAmount: tenants.depositAmount,
  status: tenants.status,
  createdAt: tenants.createdAt,
  updatedAt: tenants.updatedAt,
}

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

export const listBills = createServerFn({ method: 'GET' })
  .inputValidator((d: { status?: string; unitId?: string } | undefined) => d)
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

    const conditions = [inArray(tenants.propertyId, propertyIds)]
    if (data?.status) conditions.push(eq(bills.status, data.status as any))
    if (data?.unitId) conditions.push(eq(bills.unitId, data.unitId))

    const rows = await db
      .select({
        ...billFields,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
      })
      .from(bills)
      .innerJoin(tenants, eq(tenants.id, bills.tenantId))
      .leftJoin(units, eq(units.id, bills.unitId))
      .where(and(...conditions))
      .orderBy(desc(bills.dueDate))
      .limit(200)

    return rows
  })

export const getBill = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select(billFields).from(bills).where(eq(bills.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    const tenant = await db.select(tenantFields).from(tenants).where(eq(tenants.id, result[0].tenantId))
    if (tenant.length === 0) throw new Error('Not found')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, tenant[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Not found')

    const unit = await db.select(unitFields).from(units).where(eq(units.id, result[0].unitId))

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

    const tenant = await db.select(tenantFields).from(tenants).where(eq(tenants.id, data.tenantId))
    if (tenant.length === 0) throw new Error('Tenant not found')

    const prop = await db
      .select({ id: properties.id })
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
    }).returning({ ...billFields })

    // Notify the tenant about the new bill
    if (tenant[0].userId) {
      const dueDateFormatted = new Date(data.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      await db.insert(inbox).values({
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
        userId: tenant[0].userId,
        propertyId: tenant[0].propertyId,
        senderId: session.user.id,
        senderName: session.user.name || 'Pengelola Kost',
        recipientType: 'tenant',
        recipientPropertyId: tenant[0].propertyId,
        recipientTenantId: tenant[0].id,
        subject: 'Tagihan Baru Diterbitkan',
        body: `Tagihan baru untuk periode ${data.periodMonth}/${data.periodYear} sebesar Rp ${totalAmount.toLocaleString('id-ID')} telah diterbitkan. Jatuh tempo: ${dueDateFormatted}.`,
        category: 'pembayaran',
        isRead: false,
        readAt: null,
        priority: 'normal',
        status: 'unread',
      })
    }

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

    const existing = await db.select(billFields).from(bills).where(eq(bills.id, id))
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
      .returning({ ...billFields })

    return result[0]
  })

export const deleteBill = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select({ id: bills.id }).from(bills).where(eq(bills.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(bills).where(eq(bills.id, data.id))
    return { success: true }
  })

export const deleteMultipleBills = createServerFn({ method: 'POST' })
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    if (data.ids.length === 0) return { success: true }

    await db.delete(bills).where(inArray(bills.id, data.ids))
    return { success: true }
  })

import { getUpcomingBillsDraft } from './bills-db'

export const previewUpcomingBills = createServerFn({ method: 'GET' })
  .inputValidator((d: { date?: string } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const today = data?.date ? new Date(data.date) : new Date()
    return await getUpcomingBillsDraft(today)
  })

export const autoGenerateUpcomingBills = createServerFn({ method: 'POST' })
  .inputValidator((d: { date?: string } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const authHeader = request.headers.get('authorization')
    const isCronSecret = authHeader === `Bearer ${process.env.CRON_SECRET || 'local_secret'}`

    let authenticated = isCronSecret
    if (!authenticated) {
      const session = await auth.api.getSession({ headers: request.headers })
      if (session) authenticated = true
    }

    if (!authenticated) {
      throw new Error('Unauthorized')
    }

    const today = data?.date ? new Date(data.date) : new Date()
    const drafts = await getUpcomingBillsDraft(today)
    const toGenerate = drafts.filter((d) => !d.exists)

    let count = 0
    const now = new Date()

    for (const draft of toGenerate) {
      await db.insert(bills).values({
        id: nanoid(),
        tenantId: draft.tenantId,
        unitId: draft.unitId,
        periodMonth: draft.periodMonth,
        periodYear: draft.periodYear,
        rentAmount: draft.rentAmount,
        electricityAmount: 0,
        waterAmount: 0,
        wifiAmount: 0,
        otherAmount: 0,
        totalAmount: draft.rentAmount,
        dueDate: draft.dueDate,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      count++
    }

    console.log(`[Upcoming Bills] Generated ${count} bills`)
    return { success: true, generatedCount: count }
  })
