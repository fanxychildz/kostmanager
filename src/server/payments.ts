import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { payments, bills, tenants, units, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listPayments = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.ownerId, session.user.id))

  const propertyIds = ownerProperties.map((p) => p.id)

  const allPayments = await db.select().from(payments)
  const allBills = await db.select().from(bills)
  const allTenants = await db.select().from(tenants)
  const allUnits = await db.select().from(units)

  const filtered = allPayments
    .filter((p) => {
      const bill = allBills.find((b) => b.id === p.billId)
      if (!bill) return false
      const tenant = allTenants.find((t) => t.id === bill.tenantId)
      return tenant && propertyIds.includes(tenant.propertyId)
    })
    .map((p) => {
      const bill = allBills.find((b) => b.id === p.billId)
      const tenant = allTenants.find((t) => t.id === bill?.tenantId)
      const unit = allUnits.find((u) => u.id === bill?.unitId)
      return {
        ...p,
        tenantName: tenant?.fullName,
        unitNumber: unit?.unitNumber,
      }
    })

  return filtered
})

export const getPaymentsByBill = createServerFn({ method: 'GET' })
  .inputValidator((d: { billId: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const billRow = await db.select().from(bills).where(eq(bills.id, data.billId)).limit(1)
    if (billRow.length === 0) throw new Error('Not found: Tagihan tidak ditemukan')

    const tenantRow = await db.select().from(tenants).where(eq(tenants.id, billRow[0].tenantId)).limit(1)
    if (tenantRow.length === 0) throw new Error('Not found: Penghuni tidak ditemukan')

    const propRow = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, tenantRow[0].propertyId), eq(properties.ownerId, session.user.id)))
      .limit(1)
    if (propRow.length === 0) throw new Error('Forbidden: Properti tidak sesuai')

    const unitRow = await db.select().from(units).where(eq(units.id, billRow[0].unitId)).limit(1)
    const paymentRows = await db
      .select()
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

    const result = await db.select().from(payments).where(eq(payments.id, data.id))

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

    const bill = await db.select().from(bills).where(eq(bills.id, data.billId))
    if (bill.length === 0) throw new Error('Bill not found')

    const tenant = await db.select().from(tenants).where(eq(tenants.id, bill[0].tenantId))
    if (tenant.length === 0) throw new Error('Tenant not found')

    const prop = await db
      .select()
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
    }).returning()

    const allPayments = await db.select().from(payments).where(eq(payments.billId, data.billId))
    const totalPaid = allPayments
      .filter((p) => p.status === 'recorded')
      .reduce((sum, p) => sum + p.amount, 0)

    let newStatus: 'pending' | 'paid' | 'partial' = 'pending'
    if (totalPaid >= bill[0].totalAmount) {
      newStatus = 'paid'
    } else if (totalPaid > 0) {
      newStatus = 'partial'
    }

    await db.update(bills).set({ status: newStatus, updatedAt: now }).where(eq(bills.id, data.billId))

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

    const existing = await db.select().from(payments).where(eq(payments.id, id))
    if (existing.length === 0) throw new Error('Not found')

    const updatePayload: any = { ...updateData, updatedAt: new Date() }
    if (updateData.paidAt) updatePayload.paidAt = new Date(updateData.paidAt)

    const result = await db
      .update(payments)
      .set(updatePayload)
      .where(eq(payments.id, id))
      .returning()

    if (updateData.status === 'void' && existing[0].status === 'recorded') {
      const bill = await db.select().from(bills).where(eq(bills.id, existing[0].billId))
      if (bill.length > 0) {
        const allPayments = await db.select().from(payments).where(eq(payments.billId, bill[0].id))
        const totalPaid = allPayments
          .filter((p) => p.status === 'recorded' && p.id !== id)
          .reduce((sum, p) => sum + p.amount, 0)

        let newStatus: 'pending' | 'paid' | 'partial' = 'pending'
        if (totalPaid >= bill[0].totalAmount) {
          newStatus = 'paid'
        } else if (totalPaid > 0) {
          newStatus = 'partial'
        }

        await db.update(bills).set({ status: newStatus, updatedAt: new Date() }).where(eq(bills.id, bill[0].id))
      }
    }

    return result[0]
  })

export const deletePayment = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const existing = await db.select().from(payments).where(eq(payments.id, data.id))
    if (existing.length === 0) throw new Error('Not found')

    await db.delete(payments).where(eq(payments.id, data.id))

    if (existing[0].status === 'recorded') {
      const bill = await db.select().from(bills).where(eq(bills.id, existing[0].billId))
      if (bill.length > 0) {
        const allPayments = await db.select().from(payments).where(eq(payments.billId, bill[0].id))
        const totalPaid = allPayments
          .filter((p) => p.status === 'recorded')
          .reduce((sum, p) => sum + p.amount, 0)

        let newStatus: 'pending' | 'paid' | 'partial' = 'pending'
        if (totalPaid >= bill[0].totalAmount) {
          newStatus = 'paid'
        } else if (totalPaid > 0) {
          newStatus = 'partial'
        }

        await db.update(bills).set({ status: newStatus, updatedAt: new Date() }).where(eq(bills.id, bill[0].id))
      }
    }

    return { success: true }
  })
