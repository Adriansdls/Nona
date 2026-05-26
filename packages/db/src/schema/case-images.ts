import { pgTable, uuid, text, boolean, real, timestamp } from 'drizzle-orm/pg-core'
import { imageTypeEnum } from './enums.js'
import { vector } from './custom-types.js'
import { cases } from './cases.js'

export const caseImages = pgTable('case_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  storagePathPublic: text('storage_path_public'),
  storagePathOriginal: text('storage_path_original'),
  publicUrl: text('public_url'),
  isPrimary: boolean('is_primary').default(false),
  imageType: imageTypeEnum('image_type').notNull().default('referencia'),
  embedding: vector('embedding', { dimensions: 768 }),
  qualityScore: real('quality_score'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type CaseImage = typeof caseImages.$inferSelect
export type NewCaseImage = typeof caseImages.$inferInsert
