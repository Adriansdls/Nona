import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { point } from './custom-types.js'

export const clinicPartners = pgTable('clinic_partners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  municipality: text('municipality'),
  vetLicense: text('vet_license'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  contactTelegramId: text('contact_telegram_id'),
  telegramChatId: text('telegram_chat_id'),
  isApproved: boolean('is_approved').notNull().default(false),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  intakeSlug: text('intake_slug').unique(),
  panelToken: text('panel_token').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export type ClinicPartner = typeof clinicPartners.$inferSelect
export type NewClinicPartner = typeof clinicPartners.$inferInsert
