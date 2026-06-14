import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and } from 'drizzle-orm'
import { db } from '../db'
import { ownerInvoices, users } from '../db/schema'
import { auth } from './auth'
import { getRequest } from '@tanstack/react-start/server'
import { nanoid } from 'nanoid'

// List all owner accounts and their invoice history
export const listAllOwners = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    // In a real app, you would restrict this to a specific super-admin email list
    // e.g., if (session.user.email !== 'taufiq@kekost.com') throw new Error('Forbidden')

    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'owner'))
      .orderBy(desc(users.createdAt))

    const ownersWithInvoices = await Promise.all(
      allUsers.map(async (u) => {
        const invoices = await db
          .select()
          .from(ownerInvoices)
          .where(eq(ownerInvoices.userId, u.id))
          .orderBy(desc(ownerInvoices.createdAt))
        
        return {
          ...u,
          invoices,
        }
      })
    )

    return ownersWithInvoices
  })

// Approve owner payment verification:
// Marks invoice as paid, activates owner subscription, and extends expiry date by 30 days
export const approveOwnerPayment = createServerFn({ method: 'POST' })
  .inputValidator((invoiceId: string) => invoiceId)
  .handler(async ({ data: invoiceId }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const invoiceRows = await db
      .select()
      .from(ownerInvoices)
      .where(eq(ownerInvoices.id, invoiceId))
      .limit(1)

    if (invoiceRows.length === 0) throw new Error('Invoice not found')
    const invoice = invoiceRows[0]

    const now = new Date()
    // 1. Update invoice status to 'paid'
    await db
      .update(ownerInvoices)
      .set({
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(ownerInvoices.id, invoiceId))

    // 2. Fetch owner user profile
    const ownerRows = await db
      .select()
      .from(users)
      .where(eq(users.id, invoice.userId))
      .limit(1)

    if (ownerRows.length > 0) {
      const owner = ownerRows[0]
      let currentExpiry = owner.subscriptionExpiresAt ? new Date(owner.subscriptionExpiresAt) : new Date()
      // If subscription was already expired, start 30 days from now. Otherwise, extend from current expiry date.
      if (currentExpiry < now) {
        currentExpiry = now
      }
      
      const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000)

      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionExpiresAt: newExpiry,
          updatedAt: now,
        })
        .where(eq(users.id, invoice.userId))
    }

    return { success: true }
  })

// Reject owner payment proof:
// Reverts invoice to 'pending' and clears the uploaded proof image
export const rejectOwnerPayment = createServerFn({ method: 'POST' })
  .inputValidator((invoiceId: string) => invoiceId)
  .handler(async ({ data: invoiceId }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const now = new Date()
    await db
      .update(ownerInvoices)
      .set({
        status: 'pending',
        proofImage: null,
        updatedAt: now,
      })
      .where(eq(ownerInvoices.id, invoiceId))

    return { success: true }
  })

// Create invoice manually for an owner user
export const createOwnerInvoiceManual = createServerFn({ method: 'POST' })
  .inputValidator((d: { userId: string; amount: number; periodMonth: number; periodYear: number }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const now = new Date()
    const id = 'inv-' + nanoid()
    await db.insert(ownerInvoices).values({
      id,
      userId: data.userId,
      amount: data.amount,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, id }
  })

// Force lock/expire subscription for an owner user
export const forceExpireSubscription = createServerFn({ method: 'POST' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const now = new Date()
    await db
      .update(users)
      .set({
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
        updatedAt: now,
      })
      .where(eq(users.id, userId))

    return { success: true }
  })
