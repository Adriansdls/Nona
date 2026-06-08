import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'
import { geocodeZone } from '@/lib/geo/geocode'

// Clinic intake — photo or chip (at least one). Runs ML matching if photo present;
// always records the chip scan in chip_scans. Notifies clinic + owner + Telegram.

const MATCH_THRESHOLD = 0.55

interface ClinicIntakeBody {
  intakeSlug?: string
  stagedPhotoPath?: string
  chipNumber?: string
  municipality?: string
  zone?: string
  note?: string
  vetName?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ClinicIntakeBody | null
  if (!body?.intakeSlug || !body?.municipality) {
    return NextResponse.json({ error: 'intake_slug + municipality required' }, { status: 400 })
  }
  if (!body.stagedPhotoPath && !body.chipNumber) {
    return NextResponse.json({ error: 'photo or chip_number required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 1) Validate clinic partner
  const { data: clinic } = await supabase
    .from('clinic_partners')
    .select('id, name, intake_slug, panel_token, contact_email, contact_telegram_id')
    .eq('intake_slug', body.intakeSlug)
    .eq('is_approved', true)
    .single()

  if (!clinic) {
    return NextResponse.json({ error: 'clinic not found or not approved' }, { status: 404 })
  }

  const mlUrl = process.env['ML_SERVICE_URL']
  const zone = body.zone || body.municipality
  const coords = await geocodeZone(zone, body.municipality)

  // ---------------------------------------------------------------------------
  // 2) ML match (if photo provided)
  // ---------------------------------------------------------------------------
  let matched: { caseId: string; slug: string; score: number; dogName: string | null } | null = null
  if (body.stagedPhotoPath && mlUrl) {
    try {
      const mlRes = await fetch(`${mlUrl}/embed-only`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: body.stagedPhotoPath }),
        signal: AbortSignal.timeout(30_000),
      })
      if (mlRes.ok) {
        const { embedding } = (await mlRes.json()) as { embedding: number[] }
        const since = new Date(Date.now() - 90 * 86_400_000).toISOString()
        const { data: cands } = await supabase.rpc('search_similar_cases', {
          query_embedding: `[${embedding.join(',')}]`,
          exclude_case_id: '00000000-0000-0000-0000-000000000000',
          since,
          limit_count: 10,
        })
        const top = (cands as Array<{ case_id: string; score: number }> | null)
          ?.filter(c => c.score >= MATCH_THRESHOLD)
          .sort((a, b) => b.score - a.score)[0]
        if (top) {
          const { data: c } = await supabase
            .from('cases')
            .select('id, slug, dog_name, type, status')
            .eq('id', top.case_id)
            .eq('type', 'perdido')
            .eq('status', 'ativo')
            .maybeSingle()
          if (c) {
            matched = {
              caseId: c.id as string,
              slug: c.slug as string,
              score: top.score,
              dogName: (c.dog_name as string | null),
            }
          }
        }
      }
    } catch { /* ML down → fall through */ }
  }

  const chipLast3 = body.chipNumber
    ? body.chipNumber.slice(-3)
    : null

  // ---------------------------------------------------------------------------
  // 3) Result branch
  // ---------------------------------------------------------------------------

  // 3a) MATCHED with photo → create sighting candidate + chip scan record
  if (matched) {
    const { data: sighting } = await supabase
      .from('sightings')
      .insert({
        case_id: matched.caseId,
        seen_at: new Date().toISOString(),
        municipality: body.municipality,
        zone_approx: zone,
        coords_approx: coords ? `(${coords.lng},${coords.lat})` : null,
        description: `[Clínica ${clinic.name}] ML match ${Math.round(matched.score * 100)}%${body.note ? ` — ${body.note}` : ''}`.trim(),
        reporter_contact: null,
        observed_time_source: 'firsthand',
        observed_time_confidence: 'approximate',
        found_via_partner: clinic.intake_slug,
        is_public: false,
      })
      .select('id')
      .single()

    // record chip scan
    if (body.chipNumber) {
      await supabase.from('chip_scans').insert({
        clinic_partner_id: clinic.id,
        case_id: matched.caseId,
        chip_number: body.chipNumber,
        chip_last_3: chipLast3,
        notes: body.note ?? null,
      })
    }

    // notify clinic (async, no await)
    notifyClinic(supabase, clinic, matched, 'match')

    return NextResponse.json({
      result: 'matched',
      caseSlug: matched.slug,
      dogName: matched.dogName,
      score: Math.round(matched.score * 100),
      message: `Encontrámos um caso parecido (${Math.round(matched.score * 100)}%). O dono vai confirmar.`,
      panelUrl: `/clinica/painel/${clinic.panel_token}`,
    })
  }

  // 3b) CHIP ONLY — check if chip already scanned → link to existing case
  if (!body.stagedPhotoPath && body.chipNumber) {
    const { data: existingScan } = await supabase
      .from('chip_scans')
      .select('case_id')
      .eq('chip_number', body.chipNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingScan?.case_id) {
      // chip known → return that case
      const { data: existingCase } = await supabase
        .from('cases')
        .select('id, slug, dog_name, breed, status, reporter_contact_public')
        .eq('id', existingScan.case_id)
        .single()

      if (existingCase) {
        return NextResponse.json({
          result: 'chip_known',
          caseSlug: existingCase.slug,
          dogName: existingCase.dog_name,
          status: existingCase.status,
          message: 'Este chip já está registado.',
          panelUrl: `/clinica/painel/${clinic.panel_token}`,
        })
      }
    }
  }

  // 3c) No match OR chip unknown → auto-create a found-dog case
  const slug = generateSlug({
    type: 'encontrado',
    breed: 'indefinido',
    lastSeenMunicipality: body.municipality,
    lastSeenAt: new Date().toISOString(),
  } as Parameters<typeof generateSlug>[0])
  const ownerToken = randomBytes(16).toString('hex')

  const { data: created, error } = await supabase
    .from('cases')
    .insert({
      slug,
      type: 'encontrado',
      status: 'ativo',
      sensitivity: 'publico',
      breed: 'indefinido',
      sex: 'desconhecido',
      size: 'medio',
      primary_color: '',
      has_chip: !!body.chipNumber,
      chip_last_3: chipLast3,
      chip_number_encrypted: body.chipNumber ?? null,
      last_seen_at: new Date().toISOString(),
      last_seen_municipality: body.municipality,
      last_seen_zone_approx: zone,
      last_seen_coords_approx: coords ? `(${coords.lng},${coords.lat})` : null,
      description: body.note ?? `Cão encontrado — reportado pela clínica ${clinic.name}.`,
      reporter_email: body.vetName ? `${body.vetName}@${clinic.name.replace(/\s+/g, '').toLowerCase()}.local` : `clinica@${body.intakeSlug}.local`,
      reporter_name: clinic.name,
      reporter_contact_public: null,
      owner_token: ownerToken,
      found_via_partner: clinic.intake_slug,
    })
    .select('id, slug')
    .single()

  if (error || !created) {
    return NextResponse.json({ error: 'failed to create found case' }, { status: 500 })
  }

  // Add photo to case_images + fire ML
  if (body.stagedPhotoPath) {
    try {
      const { data: img } = await supabase
        .from('case_images')
        .insert({
          case_id: created.id,
          storage_path_original: body.stagedPhotoPath,
          is_primary: true,
          image_type: 'referencia',
        })
        .select('id')
        .single()
      if (img && mlUrl) {
        void fetch(`${mlUrl}/process-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage_path: body.stagedPhotoPath, case_image_id: img.id }),
          signal: AbortSignal.timeout(60_000),
        }).catch(() => {})
      }
    } catch { /* non-fatal */ }
  }

  // Record chip scan
  if (body.chipNumber) {
    await supabase.from('chip_scans').insert({
      clinic_partner_id: clinic.id,
      case_id: created.id,
      chip_number: body.chipNumber,
      chip_last_3: chipLast3,
      notes: body.note ?? null,
    })
  }

  // Notify clinic
  notifyClinic(supabase, clinic, created as unknown as { slug: string }, 'created')

  return NextResponse.json({
    result: 'created',
    caseSlug: created.slug,
    message: `Caso criado. Se alguém procurar, vamos cruzar.`,
    panelUrl: `/clinica/painel/${clinic.panel_token}`,
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notifyClinic(
  db: ReturnType<typeof createServiceClient>,
  clinic: { id: string; name: string; contact_email?: string | null; contact_telegram_id?: string | null },
  matchOrCase: { slug: string; dogName?: string | null; score?: number },
  kind: 'match' | 'created',
) {
  const appUrl = process.env['WEB_APP_URL'] ?? ''

  // Telegram PM to vet
  if (clinic.contact_telegram_id) {
    const tgMsg = kind === 'match'
      ? `🔔 *Cruzamento encontrado*\n\n*${matchOrCase.dogName ?? 'Cão'}* — semelhança ${Math.round((matchOrCase.score ?? 0) * 100)}%\n🔗 Ver caso: ${appUrl}/caso/${matchOrCase.slug}\n🩺 Painel: ${appUrl}/clinica/painel/${clinic.id}`
      : `✅ *Caso criado*\n\n*${matchOrCase.dogName ?? 'Cão encontrado'}*\n🔗 Ver caso: ${appUrl}/caso/${matchOrCase.slug}\n🩺 Painel: ${appUrl}/clinica/painel/${clinic.id}`

    void fetch(`${appUrl}/api/bot/notify-clinic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': process.env['INTERNAL_API_TOKEN'] ?? '' },
      body: JSON.stringify({
        telegramId: clinic.contact_telegram_id,
        message: tgMsg,
      }),
    }).catch(() => {})
  }

  // Email to clinic
  if (clinic.contact_email) {
    void fetch(`${appUrl}/api/bot/notify-clinic-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': process.env['INTERNAL_API_TOKEN'] ?? '' },
      body: JSON.stringify({
        to: clinic.contact_email,
        clinicName: clinic.name,
        caseSlug: matchOrCase.slug,
        kind,
      }),
    }).catch(() => {})
  }
}
