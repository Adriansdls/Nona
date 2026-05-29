import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// WS-G: founder (staff) manages community partners. Each partner gets an intake_slug
// (public pinned link) + panel_token (private magic panel). No account for the partner.

async function requireStaff(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const service = createServiceClient()
  const { data: caller } = await service
    .from('user_profiles').select('role, verified').eq('id', user.id).single()
  if (!caller?.verified || !['admin', 'asociacion', 'voluntario'].includes(caller.role)) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function GET() {
  const gate = await requireStaff()
  if (!gate.ok) return gate.res
  const service = createServiceClient()
  const { data } = await service
    .from('community_partners')
    .select('id, name, municipality, contact, intake_slug, panel_token, created_at')
    .order('created_at', { ascending: false })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireStaff()
  if (!gate.ok) return gate.res

  const body = (await req.json().catch(() => null)) as { name?: string; municipality?: string; contact?: string } | null
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const service = createServiceClient()
  const intakeSlug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)}-${randomBytes(3).toString('hex')}`
  const panelToken = randomBytes(16).toString('hex')

  const { data, error } = await service.from('community_partners').insert({
    name: body.name.trim(),
    municipality: body.municipality?.trim() || null,
    contact: body.contact?.trim() || null,
    intake_slug: intakeSlug,
    panel_token: panelToken,
  }).select('id, name, municipality, intake_slug, panel_token').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
