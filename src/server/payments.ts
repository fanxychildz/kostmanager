import { createServerFn } from '@tanstack/react-start'
import { eq, and, sql, inArray, desc } from 'drizzle-orm'
import { db } from '../db'
import { payments, bills, tenants, units, properties } from '../db/schema'
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

const paymentFields = {
  id: payments.id,
  billId: payments.billId,
  recordedBy: payments.recordedBy,
  paymentMethod: payments.paymentMethod,
  amount: payments.amount,
  paidAt: payments.paidAt,
  notes: payments.notes,
  status: payments.status,
  proofImage: payments.proofImage,
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
}

export async function saveProofImage(base64OrUrl: string): Promise<string> {
  if (base64OrUrl.startsWith('http') || base64OrUrl.startsWith('/uploads/')) {
    return base64OrUrl
  }

  if (!base64OrUrl.startsWith('data:image/')) {
    throw new Error('Format gambar tidak valid. Harus diawali dengan data:image/')
  }

  const match = base64OrUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Format base64 tidak valid')
  }

  const contentType = match[1]
  const base64Data = match[2]

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(contentType)) {
    throw new Error('Format berkas tidak didukung. Hanya JPEG, PNG, dan WEBP yang diperbolehkan.')
  }

  const sizeInBytes = (base64Data.length * 3) / 4
  if (sizeInBytes > 5 * 1024 * 1024) {
    throw new Error('Ukuran berkas terlalu besar. Maksimal 5MB.')
  }

  let ext = 'png'
  if (contentType === 'image/jpeg') ext = 'jpg'
  else if (contentType === 'image/webp') ext = 'webp'

  const filename = `${nanoid()}.${ext}`

  // Dynamic imports to prevent Vite client-side bundle errors
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join } = await import('node:path')

  const uploadsSubdir = join('uploads', 'payments')
  const publicDir = join(process.cwd(), 'public', uploadsSubdir)
  const distDir = join(process.cwd(), 'dist', 'client', uploadsSubdir)

  await mkdir(publicDir, { recursive: true })
  await mkdir(distDir, { recursive: true })

  const buffer = Buffer.from(base64Data, 'base64')
  
  await writeFile(join(publicDir, filename), buffer)
  try {
    await writeFile(join(distDir, filename), buffer)
  } catch (err) {
    console.warn('Could not write to distDir:', err)
  }

  return `/uploads/payments/${filename}`
}

export async function recalculateBillStatus(billId: string) {
  const billRow = await db.select(billFields).from(bills).where(eq(bills.id, billId)).limit(1)
  if (billRow.length === 0) return

  const allPayments = await db.select({ status: payments.status, amount: payments.amount }).from(payments).where(eq(payments.billId, billId))
  const totalPaid = allPayments
    .filter((p) => p.status === 'recorded' || p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  let newStatus: 'pending' | 'paid' | 'partial' = 'pending'
  if (totalPaid >= billRow[0].totalAmount) {
    newStatus = 'paid'
  } else if (totalPaid > 0) {
    newStatus = 'partial'
  }

  await db.update(bills).set({ status: newStatus, updatedAt: new Date() }).where(eq(bills.id, billId))
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

async function requireOwnerPropertyIds(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')
  const rows = await db.select({ id: properties.id }).from(properties).where(eq(properties.ownerId, session.user.id))
  return { session, propertyIds: rows.map((r) => r.id) }
}

export const listPayments = createServerFn({ method: 'GET' })
  .inputValidator((d: { billId?: string; page?: number; limit?: number } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { session, propertyIds } = await requireOwnerPropertyIds(request.headers)
    
    const isPaginated = data?.page !== undefined

    if (propertyIds.length === 0) {
      return isPaginated ? { items: [], total: 0, page: 1, limit: 50 } : []
    }

    const pageSize = Math.max(1, Math.min(200, data?.limit ?? 50))
    const page = Math.max(1, data?.page ?? 1)
    const offset = (page - 1) * pageSize

    const conditions = [inArray(tenants.propertyId, propertyIds)]
    if (data?.billId) conditions.push(eq(bills.id, data.billId))

    const base = db
      .select({
        ...paymentFields,
        tenantName: tenants.fullName,
        unitNumber: units.unitNumber,
      })
      .from(payments)
      .innerJoin(bills, eq(bills.id, payments.billId))
      .innerJoin(tenants, eq(tenants.id, bills.tenantId))
      .leftJoin(units, eq(units.id, bills.unitId))
      .where(and(...conditions))

    if (isPaginated) {
      const [items, countRow] = await Promise.all([
        base.orderBy(sql`${payments.createdAt} DESC`).limit(pageSize).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(payments)
          .innerJoin(bills, eq(bills.id, payments.billId))
          .innerJoin(tenants, eq(tenants.id, bills.tenantId))
          .where(and(...conditions)),
      ])
      return {
        items,
        total: Number(countRow[0]?.count ?? 0),
        page,
        limit: pageSize,
      }
    } else {
      return base.orderBy(sql`${payments.createdAt} DESC`).limit(200)
    }
  })

export const getPaymentsByBill = createServerFn({ method: 'GET' })
  .inputValidator((d: { billId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const billRow = await db.select(billFields).from(bills).where(eq(bills.id, data.billId)).limit(1)
    if (billRow.length === 0) throw new Error('Not found: Tagihan tidak ditemukan')

    const tenantRow = await db.select(tenantFields).from(tenants).where(eq(tenants.id, billRow[0].tenantId)).limit(1)
    if (tenantRow.length === 0) throw new Error('Not found: Penghuni tidak ditemukan')

    const propRow = await db
      .select({
        id: properties.id,
        ownerId: properties.ownerId,
        name: properties.name,
        address: properties.address,
        city: properties.city,
        province: properties.province,
        type: properties.type,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
      })
      .from(properties)
      .where(and(eq(properties.id, tenantRow[0].propertyId), eq(properties.ownerId, session.user.id)))
      .limit(1)
    if (propRow.length === 0) throw new Error('Forbidden: Properti tidak sesuai')

    const unitRow = await db
      .select({
        id: units.id,
        propertyId: units.propertyId,
        unitNumber: units.unitNumber,
        type: units.type,
        priceMonthly: units.priceMonthly,
        status: units.status,
        facilities: units.facilities,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
      })
      .from(units)
      .where(eq(units.id, billRow[0].unitId))
      .limit(1)

    const paymentRows = await db
      .select(paymentFields)
      .from(payments)
      .where(eq(payments.billId, data.billId))
      .orderBy(sql`${payments.createdAt} ASC`)

    return {
      bill: { ...billRow[0], tenantName: tenantRow[0].fullName, unitNumber: unitRow?.[0]?.unitNumber },
      property: propRow[0],
      tenant: tenantRow[0],
      unit: unitRow?.[0],
      payments: paymentRows,
    }
  })

export const getPayment = createServerFn({ method: 'GET' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const result = await db.select(paymentFields).from(payments).where(eq(payments.id, data.id))

    if (result.length === 0) throw new Error('Not found')

    return result[0]
  })

export const createPayment = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    billId: string
    paymentMethod: string
    amount: number
    paidAt: string
    notes?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const bill = await db.select(billFields).from(bills).where(eq(bills.id, data.billId))
    if (bill.length === 0) throw new Error('Bill not found')

    const tenant = await db.select({ id: tenants.id, propertyId: tenants.propertyId }).from(tenants).where(eq(tenants.id, bill[0].tenantId))
    if (tenant.length === 0) throw new Error('Tenant not found')

    const prop = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, tenant[0].propertyId), eq(properties.ownerId, session.user.id)))

    if (prop.length === 0) throw new Error('Property not found')

    const now = new Date()
    const result = await db.insert(payments).values({
      id: nanoid(),
      billId: data.billId,
      recordedBy: session.user.id,
      paymentMethod: data.paymentMethod as any,
      amount: data.amount,
      paidAt: new Date(data.paidAt),
      notes: data.notes || null,
      status: 'recorded',
      createdAt: now,
      updatedAt: now,
    }).returning({ ...paymentFields })

    await recalculateBillStatus(data.billId)

    return result[0]
  })

export const updatePayment = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    id: string
    paymentMethod?: string
    amount?: number
    paidAt?: string
    notes?: string
    status?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { id, ...updateData } = data

    const existing = await db.select(paymentFields).from(payments).where(eq(payments.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const updatePayload: any = { ...updateData, updatedAt: new Date() }
    if (updateData.paidAt) updatePayload.paidAt = new Date(updateData.paidAt)

    const result = await db
      .update(payments)
      .set(updatePayload)
      .where(eq(payments.id, id))
      .returning({ ...paymentFields })

    await recalculateBillStatus(existing[0].billId)

    return result[0]
  })

export const deletePayment = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select(paymentFields).from(payments).where(eq(payments.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(payments).where(eq(payments.id, data.id))

    await recalculateBillStatus(existing[0].billId)

    return { success: true }
  })

export const deleteMultiplePayments = createServerFn({ method: 'POST' })
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    if (data.ids.length === 0) return { success: true }

    const targetPayments = await db.select({ id: payments.id, billId: payments.billId, status: payments.status }).from(payments).where(inArray(payments.id, data.ids))
    if (targetPayments.length === 0) return { success: true }

    await db.delete(payments).where(inArray(payments.id, data.ids))

    const billIds = Array.from(new Set(targetPayments.map((p) => p.billId)))
    for (const billId of billIds) {
      await recalculateBillStatus(billId)
    }

    return { success: true }
  })
