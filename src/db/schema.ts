import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const ensurePerformanceIndexes = async () => {
  try {
    // Bisa sempat utk semua listBills/listPayments tanpa full table scan
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_tenant_property
      ON bills (tenantId, unitId, status, dueDate)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_unit_property
      ON bills (unitId, propertyId, status, dueDate)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_bills_property_period
      ON bills (propertyId, periodMonth, periodYear, status)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_bill_created
      ON payments (billId, createdAt)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_created
      ON payments (createdAt)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_expenses_property_date
      ON expenses (propertyId, date)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_meter_readings_unit_type
      ON meter_readings (unitId, type, readingDate)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_maintenance_property_status
      ON maintenance_requests (propertyId, status)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_announcements_property
      ON announcements (propertyId, createdAt)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_tenants_property_status
      ON tenants (propertyId, status)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_units_property
      ON units (propertyId, status)
    `
  } catch (e) {
    console.error('ensurePerformanceIndexes failed', e)
  }
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  name: text('name').notNull(),
  phone: text('phone'),
  image: text('image'),
  role: text('role', { enum: ['owner', 'manager', 'tenant'] }).notNull().default('owner'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

export const properties = sqliteTable(
  'properties',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    province: text('province').notNull(),
    type: text('type', { enum: ['kost', 'kontrakan', 'apartemen'] }).notNull(),
    image: text('image'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => ({
    ownerIdx: index('properties_owner_id_idx').on(t.ownerId),
  }),
)

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  unitNumber: text('unit_number').notNull(),
  type: text('type').notNull(),
  priceMonthly: integer('price_monthly').notNull(),
  status: text('status', { enum: ['available', 'occupied', 'maintenance'] }).notNull().default('available'),
  facilities: text('facilities', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  ktpNumber: text('ktp_number').notNull(),
  ktpPhotoUrl: text('ktp_photo_url'),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  occupation: text('occupation'),
  checkInDate: integer('check_in_date', { mode: 'timestamp' }).notNull(),
  checkOutDate: integer('check_out_date', { mode: 'timestamp' }),
  depositAmount: integer('deposit_amount').notNull().default(0),
  status: text('status', { enum: ['active', 'inactive', 'blacklisted'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const bills = sqliteTable('bills', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  rentAmount: integer('rent_amount').notNull(),
  electricityAmount: integer('electricity_amount').notNull().default(0),
  waterAmount: integer('water_amount').notNull().default(0),
  wifiAmount: integer('wifi_amount').notNull().default(0),
  otherAmount: integer('other_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['pending', 'paid', 'overdue', 'partial'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  recordedBy: text('recorded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  paymentMethod: text('payment_method', { enum: ['cash', 'bank_transfer', 'qris_manual', 'other'] }).notNull(),
  amount: integer('amount').notNull(),
  paidAt: integer('paid_at', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  status: text('status', { enum: ['recorded', 'void'] }).notNull().default('recorded'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  recipientType: text('recipient_type', { enum: ['tenant', 'owner'] }).notNull(),
  recipientId: text('recipient_id').notNull(),
  channel: text('channel', { enum: ['email', 'in_app'] }).notNull(),
  type: text('type', { enum: ['bill_reminder', 'payment_confirm', 'announcement', 'overdue'] }).notNull(),
  relatedBillId: text('related_bill_id').references(() => bills.id, { onDelete: 'set null' }),
  subject: text('subject'),
  messageContent: text('message_content').notNull(),
  status: text('status', { enum: ['queued', 'sent', 'delivered', 'failed'] }).notNull().default('queued'),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sender: text('sender').notNull(),
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  category: text('category').notNull().default('other'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const maintenanceRequests = sqliteTable('maintenance_requests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('Medium'),
  status: text('status').notNull().default('pending'),
  photoUrl: text('photo_url'),
  repairCost: integer('repair_cost'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
})

export const maintenanceUpdates = sqliteTable('maintenance_updates', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => maintenanceRequests.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  text: text('text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  channel: text('channel', { enum: ['owner', 'tenant', 'all'] }).notNull().default('all'),
  audience: text('audience', { enum: ['all', 'property', 'unit', 'tenant'] }).notNull().default('property'),
  targetTenantId: text('target_tenant_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export { meterReadings } from '../lib/meter-schema'
