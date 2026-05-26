import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { userRoleEnum, localeEnum } from './enums.js'

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey(),
  role: userRoleEnum('role').notNull(),
  organizationName: text('organization_name'),
  municipality: text('municipality'),
  verified: boolean('verified').notNull().default(false),
  localePreference: localeEnum('locale_preference').notNull().default('pt'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
