import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendAdminInvite } from '@/lib/email/send'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: caller } = await service
    .from('user_profiles').select('role, verified').eq('id', user.id).single()
  if (!caller?.verified || caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
  }

  const { data: newUser, error: inviteError } = await service.auth.admin.inviteUserByEmail(email)
  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  await service.from('user_profiles').insert({
    id: newUser.user.id,
    role,
    verified: false,
  })

  try {
    await sendAdminInvite({ to: email, inviterName: user.email ?? 'Admin', role })
  } catch (e) {
    console.warn('Invite email failed:', e)
  }

  return NextResponse.json({ data: { id: newUser.user.id }, error: null }, { status: 201 })
}
