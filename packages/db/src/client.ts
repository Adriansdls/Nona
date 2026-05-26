import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const connectionString = process.env['SUPABASE_DB_URL']
if (!connectionString) throw new Error('SUPABASE_DB_URL is not set')

const queryClient = postgres(connectionString, { max: 10 })

export const db = drizzle(queryClient, { schema })
export type DB = typeof db
