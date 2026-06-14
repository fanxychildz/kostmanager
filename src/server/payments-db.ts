import { db } from '../db'
import { payments, bills } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

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

  try {
    // Dynamic imports to prevent Vite client-side bundle errors
    const { writeFile, mkdir } = await import('node:fs/promises')
    const { join } = await import('node:path')

    const uploadsSubdir = join('uploads', 'payments')
    const publicDir = join(process.cwd(), 'public', uploadsSubdir)
    const distDir = join(process.cwd(), 'dist', 'client', uploadsSubdir)

    await mkdir(publicDir, { recursive: true })
    try {
      await mkdir(distDir, { recursive: true })
    } catch {
      // ignore distDir creation fail
    }

    const buffer = Buffer.from(base64Data, 'base64')
    
    await writeFile(join(publicDir, filename), buffer)
    try {
      await writeFile(join(distDir, filename), buffer)
    } catch (err) {
      console.warn('Could not write to distDir:', err)
    }

    return `/uploads/payments/${filename}`
  } catch (err) {
    console.warn('Fs upload failed, falling back to database base64 storage:', err)
    return base64OrUrl
  }
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
