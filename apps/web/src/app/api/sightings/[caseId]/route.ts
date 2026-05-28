import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sightingCreateSchema } from '@/lib/validation/sighting.schema'
import { sendNewSighting } from '@/lib/email/send'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { geocodeZone } from '@/lib/geo/geocode'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

type SightingActionRec = 'move_camera_within_6h' | 'log_and_monitor' | 'log_only'

function scoreSighting(data: {
  direction?: string | null
  wasMoving?: boolean | null
  description?: string | null
  reporterContact?: string | null
}): { score: number; recommendation: SightingActionRec } {
  // Factor 1 — observer_familiarity: public submission → max 2 (can't confirm owner)
  const observerFamiliarity = data.reporterContact ? 2 : 1

  // Factor 2 — description_specificity
  const descLen = (data.description ?? '').trim().length
  const descSpecificity = descLen > 80 ? 3 : descLen > 30 ? 2 : 1

  // Factor 3 — behavioral_match: direction of travel = most informative field
  const behavioralMatch = data.direction ? 2 : 1

  // Factor 4 — location_plausibility: assume plausible from public form (no distance calc here)
  const locationPlausibility = 2

  // Factor 5 — observation_conditions: moving+direction = good obs conditions
  const observationConditions =
    data.wasMoving !== undefined && data.wasMoving !== null && data.direction ? 3
    : data.wasMoving !== undefined && data.wasMoving !== null || data.direction ? 2
    : 1

  const score = observerFamiliarity + descSpecificity + behavioralMatch + locationPlausibility + observationConditions
  const recommendation: SightingActionRec =
    score >= 10 ? 'move_camera_within_6h'
    : score >= 7 ? 'log_and_monitor'
    : 'log_only'

  return { score, recommendation }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params
  const body = await req.json()

  const parsed = sightingCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify case exists and is active
  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, slug, dog_name, reporter_email, reporter_name, reporter_telegram_id, last_seen_municipality')
    .eq('id', caseId)
    .eq('status', 'ativo')
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found or not active' }, { status: 404 })
  }

  const sightingCoords = await geocodeZone(parsed.data.zoneApprox, parsed.data.municipality)

  const { data: sighting, error } = await supabase
    .from('sightings')
    .insert({
      case_id: caseId,
      seen_at: parsed.data.seenAt,
      municipality: parsed.data.municipality,
      zone_approx: parsed.data.zoneApprox,
      coords_approx: sightingCoords ? `(${sightingCoords.lng},${sightingCoords.lat})` : null,
      direction: parsed.data.direction ?? null,
      was_moving: parsed.data.wasMoving ?? null,
      seemed_injured: parsed.data.seemedInjured ?? null,
      description: parsed.data.description ?? null,
      reporter_contact: parsed.data.reporterContact ?? null,
      is_public: false,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to submit sighting' }, { status: 500 })
  }

  // WP12: score sighting reliability (non-fatal)
  const { score, recommendation } = scoreSighting({
    direction: parsed.data.direction ?? null,
    wasMoving: parsed.data.wasMoving ?? null,
    description: parsed.data.description ?? null,
    reporterContact: parsed.data.reporterContact ?? null,
  })
  void supabase.from('sightings').update({
    reliability_score: score,
    action_recommendation: recommendation,
  }).eq('id', sighting.id).then(() => {})

  const dogName = (caseRow.dog_name as string | null) ?? 'o seu cão'
  const caseUrl = `${APP_URL}/pt/caso/${caseRow.slug as string}`

  // Email notify (non-fatal)
  void sendNewSighting({
    to: caseRow.reporter_email as string,
    reporterName: caseRow.reporter_name as string,
    caseSlug: caseRow.slug as string,
    municipality: parsed.data.municipality,
    zoneApprox: parsed.data.zoneApprox,
  }).catch((e) => console.warn('Sighting email failed:', e))

  // Telegram notify with score hint (non-fatal)
  const scoreHint = recommendation === 'move_camera_within_6h'
    ? '\n⚡ Alta fiabilidade — o sistema irá ajustar o protocolo.'
    : recommendation === 'log_and_monitor'
    ? '\n👁 Fiabilidade média — a equipa irá monitorizar.'
    : ''
  void sendTelegramMessage(
    caseRow.reporter_telegram_id as string | null,
    `🐾 *Novo avistamento de ${dogName}!*\n\nZona: ${parsed.data.zoneApprox}, ${parsed.data.municipality}${scoreHint}\n\nA equipa irá rever antes de publicar.\n\n[Ver caso](${caseUrl})`,
  ).catch(() => {})

  return NextResponse.json({
    data: { id: sighting.id, reliability_score: score, action_recommendation: recommendation },
  }, { status: 201 })
}
