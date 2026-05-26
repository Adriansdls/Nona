import { pgTable, uuid, real, timestamp } from 'drizzle-orm/pg-core'
import { matchStatusEnum } from './enums.js'
import { cases } from './cases.js'

export const visualMatches = pgTable('visual_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseAId: uuid('case_a_id').notNull().references(() => cases.id),
  caseBId: uuid('case_b_id').notNull().references(() => cases.id),
  similarityScore: real('similarity_score').notNull(),
  status: matchStatusEnum('status').notNull().default('pendente'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type VisualMatch = typeof visualMatches.$inferSelect
export type NewVisualMatch = typeof visualMatches.$inferInsert
