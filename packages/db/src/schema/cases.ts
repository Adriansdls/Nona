import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import {
  caseTypeEnum, caseStatusEnum, caseSensitivityEnum,
  dogSexEnum, dogSizeEnum,
} from './enums.js'
import { point } from './custom-types.js'

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  type: caseTypeEnum('type').notNull(),
  status: caseStatusEnum('status').notNull().default('ativo'),
  sensitivity: caseSensitivityEnum('sensitivity').notNull().default('publico'),
  dogName: text('dog_name'),
  breed: text('breed').notNull(),
  sex: dogSexEnum('sex').notNull(),
  neutered: boolean('neutered'),
  size: dogSizeEnum('size').notNull(),
  primaryColor: text('primary_color').notNull(),
  secondaryColor: text('secondary_color'),
  distinctiveMarks: text('distinctive_marks').array().default([]),
  ageEstimate: text('age_estimate'),
  hasChip: boolean('has_chip'),
  chipLast3: text('chip_last_3'),
  chipNumberEncrypted: text('chip_number_encrypted'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  lastSeenMunicipality: text('last_seen_municipality').notNull(),
  lastSeenZoneApprox: text('last_seen_zone_approx').notNull(),
  lastSeenCoordsApprox: point('last_seen_coords_approx'),
  description: text('description').notNull(),
  context: text('context'),
  suspectedTheft: boolean('suspected_theft').default(false),
  reporterName: text('reporter_name').notNull(),
  reporterEmail: text('reporter_email').notNull(),
  reporterPhone: text('reporter_phone'),
  reporterContactPublic: text('reporter_contact_public'),
  reporterTelegramId: text('reporter_telegram_id'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
})

export type Case = typeof cases.$inferSelect
export type NewCase = typeof cases.$inferInsert
