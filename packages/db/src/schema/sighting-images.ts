import { pgTable, uuid, text } from 'drizzle-orm/pg-core'
import { vector } from './custom-types.js'
import { sightings } from './sightings.js'

export const sightingImages = pgTable('sighting_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  sightingId: uuid('sighting_id').notNull().references(() => sightings.id, { onDelete: 'cascade' }),
  storagePathPublic: text('storage_path_public').notNull(),
  publicUrl: text('public_url').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
})

export type SightingImage = typeof sightingImages.$inferSelect
export type NewSightingImage = typeof sightingImages.$inferInsert
