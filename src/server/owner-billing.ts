import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { ownerInvoices, users } from '../db/schema'
import { auth } from './auth'
import { getRequest } from '@tanstack/react-start/server'
import { nanoid } from 'nanoid'

export const listInvoices = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== 'owner') throw new Error('Unauthorized')

    const result = await db
      .select()
      .from(ownerInvoices)
      .where(eq(ownerInvoices.userId, session.user.id))
      .orderBy(desc(ownerInvoices.createdAt))

    return result
  })

export const submitPaymentProof = createServerFn({ method: 'POST' })
  .inputValidator((d: { invoiceId: string; proofImage: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== 'owner') throw new Error('Unauthorized')

    const invoice = await db
      .select()
      .from(ownerInvoices)
      .where(eq(ownerInvoices.id, data.invoiceId))
      .limit(1)

    if (invoice.length === 0) throw new Error('Invoice not found')
    if (invoice[0].userId !== session.user.id) throw new Error('Forbidden')

    const now = new Date()
    await db
      .update(ownerInvoices)
      .set({
        status: 'pending_verification',
        proofImage: data.proofImage,
        updatedAt: now,
      })
      .where(eq(ownerInvoices.id, data.invoiceId))

    return { success: true }
  })

export const simulateSubscriptionState = createServerFn({ method: 'POST' })
  .inputValidator((action: 'expire' | 'activate') => action)
  .handler(async ({ data: action }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== 'owner') throw new Error('Unauthorized')

    const now = new Date()
    if (action === 'expire') {
      // Set user's subscription status to expired and expiration date to yesterday
      await db
        .update(users)
        .set({
          subscriptionStatus: 'expired',
          subscriptionExpiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
          updatedAt: now,
        })
        .where(eq(users.id, session.user.id))

      // Check if there is already a pending invoice for this month
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const existingInvoice = await db
        .select()
        .from(ownerInvoices)
        .where(
          and(
            eq(ownerInvoices.userId, session.user.id),
            eq(ownerInvoices.periodMonth, currentMonth),
            eq(ownerInvoices.periodYear, currentYear)
          )
        )
        .limit(1)

      if (existingInvoice.length === 0) {
        await db.insert(ownerInvoices).values({
          id: 'inv-' + nanoid(),
          userId: session.user.id,
          amount: 49000,
          periodMonth: currentMonth,
          periodYear: currentYear,
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        })
      }
    } else {
      // Activate user's subscription and set expiration to 30 days from now
      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .where(eq(users.id, session.user.id))

      // Mark all pending owner invoices as paid
      await db
        .update(ownerInvoices)
        .set({
          status: 'paid',
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(ownerInvoices.userId, session.user.id))
    }

    return { success: true }
  })

export const requestUpgradeToPro = createServerFn({ method: 'POST' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== 'owner') throw new Error('Unauthorized')

    const owner = await db.select().from(users).where(eq(users.id, session.user.id)).then(r => r[0])
    if (!owner) throw new Error('Owner not found')
    if (owner.subscriptionExpiresAt) throw new Error('Akun Anda sudah menggunakan Paket Pro.')

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Check if there is already a pending invoice
    const existing = await db
      .select()
      .from(ownerInvoices)
      .where(
        and(
          eq(ownerInvoices.userId, session.user.id),
          eq(ownerInvoices.status, 'pending')
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return { success: true, invoiceId: existing[0].id }
    }

    const id = 'inv-' + nanoid()
    await db.insert(ownerInvoices).values({
      id,
      userId: session.user.id,
      amount: 49000,
      periodMonth: currentMonth,
      periodYear: currentYear,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, invoiceId: id }
  })
