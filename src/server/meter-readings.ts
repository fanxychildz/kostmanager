import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { meterReadings } from '../lib/meter-schema'
import { units } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

export const listMeterReadings = createServerFn({ method: 'GET' })
  .inputValidator((d: { unitId?: string; type?: 'electricity' | 'water' } | undefined) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    let query = db.select().from(meterReadings)

    if (data?.unitId) query = query.where(eq(meterReadings.unitId, data.unitId))
    if (data?.type) query = query.where(eq(meterReadings.type, data.type))

    return query.orderBy(sql`${meterReadings.readingDate} DESC`).limit(200)
  })

export const createMeterReading = createServerFn({ method: 'POST' })
  .inputValidator((d: {
    type: 'electricity' | 'water'
    value: number
    readingDate: string
    tariffPerUnit: number
    notes?: string
    unitId?: string
  }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const unitId = data.unitId || null

    const now = new Date()
    const result = await db.insert(meterReadings).values({
      id: nanoid(),
      unitId: unitId!,
      type: data.type,
      value: data.value,
      readingDate: new Date(data.readingDate),
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      tariffPerUnit: data.tariffPerUnit,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return result[0]
  })
