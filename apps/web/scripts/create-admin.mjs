#!/usr/bin/env node
// Create (or promote) a SalvaCão admin user.
// Usage: node scripts/create-admin.mjs <email> <password> [organization_name]
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local / env.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

function loadEnv() {
  const env = { ...process.env }
  for (const fn of ['.env.local', '.env']) {
    try {
      for (const line of readFileSync(fn, 'utf8').split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#') || !t.includes('=')) continue
        const i = t.indexOf('=')
        const k = t.slice(0, i)
        if (!(k in env)) env[k] = t.slice(i + 1)
      }
    } catch { /* file may not exist */ }
  }
  return env
}

const [email, password, orgName] = process.argv.slice(2)
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [organization_name]')
  process.exit(1)
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// 1. Create the auth user (email pre-confirmed so they can log in immediately).
let userId
const created = await sb.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (created.error) {
  // Already exists → find the user and reset the password.
  if (/already|registered|exists/i.test(created.error.message)) {
    const { data: list, error: listErr } = await sb.auth.admin.listUsers()
    if (listErr) { console.error('listUsers failed:', listErr.message); process.exit(1) }
    const existing = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!existing) { console.error('User exists but not found in list — aborting'); process.exit(1) }
    userId = existing.id
    const upd = await sb.auth.admin.updateUserById(userId, { password, email_confirm: true })
    if (upd.error) { console.error('password reset failed:', upd.error.message); process.exit(1) }
    console.log('Existing auth user found; password updated. id=', userId)
  } else {
    console.error('createUser failed:', created.error.message)
    process.exit(1)
  }
} else {
  userId = created.data.user.id
  console.log('Auth user created. id=', userId)
}

// 2. Upsert the verified admin profile.
const { error: profErr } = await sb
  .from('user_profiles')
  .upsert({ id: userId, role: 'admin', verified: true, organization_name: orgName ?? 'Nona' }, { onConflict: 'id' })
if (profErr) { console.error('profile upsert failed:', profErr.message); process.exit(1) }

console.log('✅ Admin ready:', email, '(role=admin, verified=true)')
console.log('   Log in at /login then open /pt/admin')
