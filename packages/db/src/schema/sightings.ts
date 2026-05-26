import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { sightingCredibilityEnum } from './enums.js'
import { point } from './custom-types.js'
import { cases } from './cases.js'

export const sightings = pgTable('sightings', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  seenAt: timestamp('seen_at', { withTimezone: true }).notNull(),
  municipality: text('municipality').notNull(),
  zoneApprox: text('zone_approx').notNull(),
  coordsApprox: point('coords_approx'),
  direction: text('direction'),
  wasMoving: boolean('was_moving'),
  seemedInjured: boolean('seemed_injured'),
  description: text('description'),
  reporterContact: text('reporter_contact'),
  credibility: sightingCredibilityEnum('credibility').notNull().default('pendente'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Sighting = typeof sightings.$inferSelect
export type NewSighting = typeof sightings.$inferInsert
