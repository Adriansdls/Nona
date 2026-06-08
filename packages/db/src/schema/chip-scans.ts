import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { siacLookupStatusEnum } from './enums.js'

export const chipScans = pgTable('chip_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicPartnerId: uuid('clinic_partner_id').notNull(),
  caseId: uuid('case_id'),
  chipNumber: text('chip_number'),
  chipLast3: text('chip_last_3'),
  siacLookupStatus: siacLookupStatusEnum('siac_lookup_status').notNull().default('nao_realizado'),
  siacLookupDoneAt: timestamp('siac_lookup_done_at', { withTimezone: true }),
  ownerName: text('owner_name'),
  ownerContact: text('owner_contact'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type ChipScan = typeof chipScans.$inferSelect
export type NewChipScan = typeof chipScans.$inferInsert
