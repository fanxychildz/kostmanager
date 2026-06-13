import { db } from '../db'
import { bills, tenants, units } from '../db/schema'
import { eq, and } from 'drizzle-orm'

function normalizeDate(d: Date): Date {
  const res = new Date(d)
  res.setHours(0, 0, 0, 0)
  return res
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export async function getUpcomingBillsDraft(today: Date = new Date()) {
  const todayNormalized = normalizeDate(today)
  const targetDueDate = new Date(todayNormalized)
  targetDueDate.setDate(targetDueDate.getDate() + 7)

  const activeTenants = await db
    .select({
      id: tenants.id,
      fullName: tenants.fullName,
      checkInDate: tenants.checkInDate,
      unitId: tenants.unitId,
      propertyId: tenants.propertyId,
    })
    .from(tenants)
    .where(eq(tenants.status, 'active'))

  const drafts: any[] = []

  for (const tenant of activeTenants) {
    const checkIn = new Date(tenant.checkInDate)
    
    const targetMonth = targetDueDate.getMonth() + 1
    const targetYear = targetDueDate.getFullYear()
    const lastDay = getLastDayOfMonth(targetYear, targetMonth)
    const dueDay = Math.min(checkIn.getDate(), lastDay)
    
    const expectedDueDate = new Date(targetYear, targetMonth - 1, dueDay)
    
    if (normalizeDate(expectedDueDate).getTime() === targetDueDate.getTime()) {
      const [unit] = await db
        .select({ priceMonthly: units.priceMonthly, unitNumber: units.unitNumber })
        .from(units)
        .where(eq(units.id, tenant.unitId))
        .limit(1)

      if (!unit) continue

      const existing = await db
        .select({ id: bills.id })
        .from(bills)
        .where(
          and(
            eq(bills.tenantId, tenant.id),
            eq(bills.periodMonth, targetMonth),
            eq(bills.periodYear, targetYear)
          )
        )
        .limit(1)

      drafts.push({
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        unitId: tenant.unitId,
        unitNumber: unit.unitNumber,
        propertyId: tenant.propertyId,
        periodMonth: targetMonth,
        periodYear: targetYear,
        rentAmount: unit.priceMonthly,
        dueDate: expectedDueDate,
        exists: existing.length > 0,
      })
    }
  }

  return drafts
}
