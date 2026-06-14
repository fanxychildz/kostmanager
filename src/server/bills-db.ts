import { db } from '../db'
import { bills, tenants, units, properties } from '../db/schema'
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

  // Ambil penyewa aktif, serta hubungkan ke properti untuk mendapatkan ownerId
  const activeTenants = await db
    .select({
      id: tenants.id,
      userId: tenants.userId,
      fullName: tenants.fullName,
      checkInDate: tenants.checkInDate,
      unitId: tenants.unitId,
      propertyId: tenants.propertyId,
      ownerId: properties.ownerId,
    })
    .from(tenants)
    .innerJoin(properties, eq(tenants.propertyId, properties.id))
    .where(eq(tenants.status, 'active'))

  const drafts: any[] = []

  // Batas pengecekan mundur (maksimal 60 hari sebelum hari ini)
  const startLimit = new Date(todayNormalized)
  startLimit.setDate(startLimit.getDate() - 60)

  for (const tenant of activeTenants) {
    const checkIn = new Date(tenant.checkInDate)
    const startDate = checkIn > startLimit ? checkIn : startLimit

    const endYear = targetDueDate.getFullYear()
    const endMonth = targetDueDate.getMonth() + 1

    let currentYear = startDate.getFullYear()
    let currentMonth = startDate.getMonth() + 1

    // Periksa setiap bulan dari startDate sampai bulan targetDueDate (H-7)
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const lastDay = getLastDayOfMonth(currentYear, currentMonth)
      const dueDay = Math.min(checkIn.getDate(), lastDay)
      const expectedDueDate = new Date(currentYear, currentMonth - 1, dueDay)
      const expectedDueDateNormalized = normalizeDate(expectedDueDate)

      // Hanya jika tanggal jatuh tempo yang diperkirakan berada di dalam rentang:
      // [tanggal masuk tenant, hari ini + 7 hari]
      if (
        expectedDueDateNormalized.getTime() >= normalizeDate(checkIn).getTime() &&
        expectedDueDateNormalized.getTime() <= targetDueDate.getTime()
      ) {
        const [unit] = await db
          .select({ priceMonthly: units.priceMonthly, unitNumber: units.unitNumber })
          .from(units)
          .where(eq(units.id, tenant.unitId))
          .limit(1)

        if (unit) {
          const existing = await db
            .select({ id: bills.id })
            .from(bills)
            .where(
              and(
                eq(bills.tenantId, tenant.id),
                eq(bills.periodMonth, currentMonth),
                eq(bills.periodYear, currentYear)
              )
            )
            .limit(1)

          drafts.push({
            tenantId: tenant.id,
            tenantUserId: tenant.userId,
            tenantName: tenant.fullName,
            unitId: tenant.unitId,
            unitNumber: unit.unitNumber,
            propertyId: tenant.propertyId,
            ownerId: tenant.ownerId,
            periodMonth: currentMonth,
            periodYear: currentYear,
            rentAmount: unit.priceMonthly,
            dueDate: expectedDueDate,
            exists: existing.length > 0,
          })
        }
      }

      currentMonth++
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }
    }
  }

  return drafts
}

