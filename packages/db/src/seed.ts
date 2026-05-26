import { db } from './client.js'
import { userProfiles } from './schema/index.js'

async function seed() {
  console.log('Seeding database...')

  await db.insert(userProfiles).values({
    id: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    organizationName: 'SalvaCão Admin',
    municipality: 'Faro',
    verified: true,
    localePreference: 'pt',
  }).onConflictDoNothing()

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
