import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { units } from '../db/schema'

export const meterReadings = sqliteTable('meter_readings', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['electricity', 'water'] }).notNull(),
  value: integer('value').notNull(),
  readingDate: integer('reading_date', { mode: 'timestamp' }).notNull(),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  tariffPerUnit: integer('tariff_per_unit').notNull().default(0),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
