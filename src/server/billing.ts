import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { bills, tenants, units } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const generateMonthlyBills = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const activeTenants = await db
    .select()
    .from(tenants)
    .where(eq(tenants.status, 'active'))

  const generatedBills = []

  for (const tenant of activeTenants) {
    const existingBill = await db
      .select()
      .from(bills)
      .where(eq(bills.tenantId, tenant.id))
      .then((results) =>
        results.find(
          (b) => b.periodMonth === currentMonth && b.periodYear === currentYear
        )
      )

    if (existingBill) {
      console.log(`Bill already exists for tenant ${tenant.fullName} for ${currentMonth}/${currentYear}`)
      continue
    }

    const unit = await db.select().from(units).where(eq(units.id, tenant.unitId))
    if (unit.length === 0) continue

    const rentAmount = unit[0].priceMonthly
    const electricityAmount = 0
    const waterAmount = 0
    const wifiAmount = 0
    const otherAmount = 0
    const totalAmount = rentAmount + electricityAmount + waterAmount + wifiAmount + otherAmount

    const dueDate = new Date(currentYear, currentMonth - 1, 5)

    const bill = await db.insert(bills).values({
      id: nanoid(),
      tenantId: tenant.id,
      unitId: tenant.unitId,
      periodMonth: currentMonth,
      periodYear: currentYear,
      rentAmount,
      electricityAmount,
      waterAmount,
      wifiAmount,
      otherAmount,
      totalAmount,
      dueDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning()

    generatedBills.push(bill[0])
    console.log(`Generated bill for ${tenant.fullName}: Rp ${totalAmount}`)
  }

  return { generated: generatedBills.length, bills: generatedBills }
})

export const checkOverdueBills = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Unauthorized')

  const now = new Date()
  const allBills = await db.select().from(bills)

  const overdueBills = allBills.filter(
    (bill) => bill.status === 'pending' && bill.dueDate < now
  )

  for (const bill of overdueBills) {
    await db
      .update(bills)
      .set({ status: 'overdue', updatedAt: now })
      .where(eq(bills.id, bill.id))
  }

  console.log(`Marked ${overdueBills.length} bills as overdue`)
  return { marked: overdueBills.length, bills: overdueBills }
})
