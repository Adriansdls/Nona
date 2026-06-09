import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// WS-G-Vet: staff manages clinic partners.
// GET  → list all clinics
// POST → create new clinic (generates intake_slug + panel_token)

async function requireStaff(): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const service = createServiceClient()
  const { data: caller } = await service
    .from('user_profiles').select('role, verified').eq('id', user.id).single()
  if (!caller?.verified || !['admin', 'asociacion'].includes(caller.role)) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true }
}

export async function GET() {
  const gate = await requireStaff()
  if (!gate.ok) return gate.res

  const service = createServiceClient()
  const { data } = await service
    .from('clinic_partners')
    .select('id, name, municipality, vet_license, contact_email, contact_phone, is_approved, approved_at, intake_slug, panel_token, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const gate = await requireStaff()
  if (!gate.ok) return gate.res

  const body = (await req.json().catch(() => null)) as {
    name?: string
    municipality?: string
    vet_license?: string
    contact_email?: string
    contact_phone?: string
    contact_telegram_id?: string
  } | null

  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const service = createServiceClient()
  const intakeSlug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)}-${randomBytes(3).toString('hex')}`
  const panelToken = randomBytes(16).toString('hex')

  const { data, error } = await service
    .from('clinic_partners')
    .insert({
      name: body.name.trim(),
      municipality: body.municipality?.trim() || null,
      vet_license: body.vet_license?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
      contact_telegram_id: body.contact_telegram_id?.trim() || null,
      intake_slug: intakeSlug,
      panel_token: panelToken,
      is_approved: false,
    })
    .select('id, name, municipality, intake_slug, panel_token, is_approved')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const gate = await requireStaff()
  if (!gate.ok) return gate.res

  const body = (await req.json().catch(() => null)) as {
    id?: string
    is_approved?: boolean
  } | null

  if (!body?.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const service = createServiceClient()
  const updates: Record<string, unknown> = {
    is_approved: body.is_approved,
  }
  if (body.is_approved) {
    updates.approved_at = new Date().toISOString()
  }

  const { error } = await service
    .from('clinic_partners')
    .update(updates)
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
