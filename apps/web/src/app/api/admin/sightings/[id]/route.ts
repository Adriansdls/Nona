import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getAuthRole() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data: profile } = await service
    .from('user_profiles').select('role, verified').eq('id', user.id).single()
  if (!profile?.verified) return null
  return { userId: user.id, role: profile.role }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthRole()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'asociacion'].includes(auth.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const supabase = createServiceClient()

  const updateData: Record<string, unknown> = {}
  if ('is_public' in body) updateData['is_public'] = body.is_public
  if ('credibility' in body) updateData['credibility'] = body.credibility
  if (body.is_public === true) {
    updateData['reviewed_by'] = auth.userId
    updateData['reviewed_at'] = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('sightings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}
