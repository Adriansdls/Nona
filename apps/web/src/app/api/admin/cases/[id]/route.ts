import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { sendCaseResolved } from '@/lib/email/send'

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
    .from('user_profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single()
  if (!profile?.verified) return null
  return { userId: user.id, role: profile.role }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthRole()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('cases')
    .select('*, case_images(*), sightings(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data, error: null })
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

  // Fetch old status to detect resolution
  const { data: old } = await supabase
    .from('cases')
    .select('status, reporter_email, reporter_name, dog_name, slug')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('cases')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send resolved email
  if (body.status === 'resolvido' && old?.status !== 'resolvido') {
    try {
      await sendCaseResolved({
        to: old!.reporter_email,
        reporterName: old!.reporter_name,
        caseSlug: old!.slug,
        dogName: old!.dog_name,
      })
    } catch (e) {
      console.warn('Resolved email failed:', e)
    }
  }

  return NextResponse.json({ data, error: null })
}
