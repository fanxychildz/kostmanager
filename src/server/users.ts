import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users, tenants } from '../db/schema'
import { auth } from './auth'
import { getRequest } from '@tanstack/react-start/server'

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((d: { name?: string; phone?: string; image?: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const updatePayload: { name?: string; phone?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.image !== undefined) updatePayload.image = data.image

    const result = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        name: users.name,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })

    if (result.length === 0) throw new Error('Not found')

    if (session.user.role === 'tenant') {
      const tenantPayload: { fullName?: string; phone?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      }
      if (data.name !== undefined) tenantPayload.fullName = data.name
      if (data.phone !== undefined) tenantPayload.phone = data.phone

      await db
        .update(tenants)
        .set(tenantPayload)
        .where(eq(tenants.userId, session.user.id))
    }

    return result[0]
  })

export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator((d: { currentPassword: string; newPassword: string }) => d)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    await auth.api.changePassword({
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      },
      headers: request.headers,
    })

    return { success: true }
  })
