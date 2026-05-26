import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { posterTypeEnum, posterLanguageEnum } from './enums.js'
import { cases } from './cases.js'

export const posters = pgTable('posters', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  publicUrl: text('public_url').notNull(),
  posterType: posterTypeEnum('poster_type').notNull(),
  language: posterLanguageEnum('language').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type Poster = typeof posters.$inferSelect
export type NewPoster = typeof posters.$inferInsert
