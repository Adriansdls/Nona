import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { generateSlug } from '@/lib/slug'
import { geocodeZone } from '@/lib/geo/geocode'

// WS-D — standalone finder ("vi/encontrei um cão"): photo + location, no account.
// Embed the photo → match active perdido cases. Match → sighting-candidate on that
// case (owner triages). No match → auto-create an 'encontrado' case so future
// perdidos can match it. partnerId attributes a community submission (WS-G).

const MATCH_THRESHOLD = 0.55

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    stagedPhotoPath?: string
    municipality?: string
    zone?: string
    note?: string
    contact?: string
    partnerId?: string
  } | null

  if (!body?.stagedPhotoPath || !body?.municipality) {
    return NextResponse.json({ error: 'photo + municipality required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const mlUrl = process.env['ML_SERVICE_URL']
  const zone = body.zone || body.municipality
  const coords = await geocodeZone(zone, body.municipality)

  // 1) Try ML match against active perdido cases.
  let matched: { caseId: string; slug: string; score: number; dogName: string | null } | null = null
  if (mlUrl) {
    try {
      const mlRes = await fetch(`${mlUrl}/embed-only`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: body.stagedPhotoPath }),
        signal: AbortSignal.timeout(30_000),
      })
      if (mlRes.ok) {
        const { embedding } = (await mlRes.json()) as { embedding: number[] }
        const since = new Date(Date.now() - 90 * 86_400_000).toISOString()
        const { data: cands } = await supabase.rpc('search_similar_cases', {
          query_embedding: `[${embedding.join(',')}]`,
          exclude_case_id: '00000000-0000-0000-0000-000000000000',
          since, limit_count: 10,
        })
        const top = (cands as Array<{ case_id: string; score: number }> | null)
          ?.filter(c => c.score >= MATCH_THRESHOLD)
          .sort((a, b) => b.score - a.score)[0]
        if (top) {
          const { data: c } = await supabase
            .from('cases').select('id, slug, dog_name, type, status')
            .eq('id', top.case_id).eq('type', 'perdido').eq('status', 'ativo').maybeSingle()
          if (c) matched = { caseId: c.id as string, slug: c.slug as string, score: top.score, dogName: (c.dog_name as string | null) }
        }
      }
    } catch { /* ML down → fall through to auto-case */ }
  }

  // 2a) Match → sighting-candidate on that case (enters owner triage, WP17).
  if (matched) {
    await supabase.from('sightings').insert({
      case_id: matched.caseId,
      seen_at: new Date().toISOString(),
      municipality: body.municipality,
      zone_approx: zone,
      coords_approx: coords ? `(${coords.lng},${coords.lat})` : null,
      description: `[Finder ML match ${Math.round(matched.score * 100)}%] ${body.note ?? ''}`.trim(),
      reporter_contact: body.contact ?? null,
      observed_time_source: 'firsthand',
      observed_time_confidence: 'approximate',
      found_via_partner: body.partnerId ?? null,
      is_public: false,
    })
    return NextResponse.json({
      result: 'matched',
      caseSlug: matched.slug,
      dogName: matched.dogName,
      score: Math.round(matched.score * 100),
      message: 'Encontrámos um caso parecido. O dono vai confirmar se é o cão dele.',
    })
  }

  // 2b) No match → auto-create an 'encontrado' case (minimal, public).
  const slug = generateSlug({
    type: 'encontrado', breed: 'indefinido',
    lastSeenMunicipality: body.municipality, lastSeenAt: new Date().toISOString(),
  } as Parameters<typeof generateSlug>[0])
  const ownerToken = randomBytes(16).toString('hex')

  const { data: created, error } = await supabase.from('cases').insert({
    slug, type: 'encontrado', status: 'ativo', sensitivity: 'publico',
    breed: 'indefinido', sex: 'desconhecido', size: 'medio', primary_color: '',
    last_seen_at: new Date().toISOString(),
    last_seen_municipality: body.municipality,
    last_seen_zone_approx: zone,
    last_seen_coords_approx: coords ? `(${coords.lng},${coords.lat})` : null,
    description: body.note ?? 'Cão encontrado — reportado pela comunidade.',
    reporter_email: 'noreply@nona.pt',
    reporter_name: 'Comunidade',
    reporter_contact_public: body.contact ?? null,
    owner_token: ownerToken,
    found_via_partner: body.partnerId ?? null,
  }).select('id, slug').single()

  if (error || !created) {
    return NextResponse.json({ error: 'failed to create found case' }, { status: 500 })
  }

  // Attach the photo + fire ML (so future perdidos match this found dog).
  try {
    const { data: img } = await supabase.from('case_images').insert({
      case_id: created.id, storage_path_original: body.stagedPhotoPath,
      is_primary: true, image_type: 'referencia',
    }).select('id').single()
    if (img && mlUrl) {
      void fetch(`${mlUrl}/process-image`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: body.stagedPhotoPath, case_image_id: img.id }),
        signal: AbortSignal.timeout(60_000),
      }).catch(() => {})
    }
  } catch { /* non-fatal */ }

  return NextResponse.json({
    result: 'created',
    caseSlug: created.slug,
    message: 'Criámos um caso para este cão encontrado. Se alguém o procura, vamos cruzar.',
  })
}
