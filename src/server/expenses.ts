import { createServerFn } from '@tanstack/react-start'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db'
import { expenses, properties } from '../db/schema'
import { auth } from './auth'
import { nanoid } from 'nanoid'
import { getRequest } from '@tanstack/react-start/server'

async function requireOwnerProperties(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new Error('Unauthorized')

  const ownerProps = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.ownerId, session.user.id))

  return { session, propertyIds: ownerProps.map((p) => p.id) }
}

export const listExpenses = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const { propertyIds } = await requireOwnerProperties(request.headers)

  if (propertyIds.length === 0) return []

  const result = await db
    .select()
    .from(expenses)
    .where(inArray(expenses.propertyId, propertyIds))
    .orderBy(expenses.date)

  return result
})

export const createExpense = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      propertyId: string
      title: string
      amount: number
      category: string
      date: string | Date
      notes?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwnerProperties(request.headers)

    if (!propertyIds.includes(data.propertyId)) {
      throw new Error('Forbidden: Properti tidak dimiliki')
    }

    const now = new Date()
    const result = await db
      .insert(expenses)
      .values({
        id: nanoid(),
        propertyId: data.propertyId,
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return result[0]
  })

export const updateExpense = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: {
      id: string
      propertyId: string
      title: string
      amount: number
      category: string
      date: string | Date
      notes?: string | null
    }) => d,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwnerProperties(request.headers)

    if (!propertyIds.includes(data.propertyId)) {
      throw new Error('Forbidden: Properti tidak dimiliki')
    }

    const { id, ...updateData } = data

    // Verify expense exists and belongs to owner's properties
    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), inArray(expenses.propertyId, propertyIds)))
      .then((r) => r[0])

    if (!existing) throw new Error('Not found: Pengeluaran tidak ditemukan')

    const result = await db
      .update(expenses)
      .set({
        propertyId: updateData.propertyId,
        title: updateData.title,
        amount: updateData.amount,
        category: updateData.category,
        date: new Date(updateData.date),
        notes: updateData.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning()

    return result[0]
  })

export const deleteExpense = createServerFn({ method: 'POST' })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const { propertyIds } = await requireOwnerProperties(request.headers)

    if (propertyIds.length === 0) throw new Error('Forbidden')

    const result = await db
      .delete(expenses)
      .where(and(eq(expenses.id, data.id), inArray(expenses.propertyId, propertyIds)))
      .returning()

    if (result.length === 0) throw new Error('Not found: Pengeluaran tidak ditemukan')

    return { success: true }
  })
