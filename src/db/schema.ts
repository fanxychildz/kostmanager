import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  name: text('name').notNull(),
  phone: text('phone'),
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

export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  province: text('province').notNull(),
  type: text('type', { enum: ['kost', 'kontrakan', 'apartemen'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

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
