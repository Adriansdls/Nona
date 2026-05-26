import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '../../.env.local' })

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['SUPABASE_DB_URL']!,
  },
  verbose: true,
  strict: true,
})
