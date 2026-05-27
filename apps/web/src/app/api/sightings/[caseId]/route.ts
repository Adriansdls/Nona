import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sightingCreateSchema } from '@/lib/validation/sighting.schema'
import { sendNewSighting } from '@/lib/email/send'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { geocodeZone } from '@/lib/geo/geocode'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

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

  // Telegram notify (non-fatal)
  void sendTelegramMessage(
    caseRow.reporter_telegram_id as string | null,
    `🐾 *Novo avistamento de ${dogName}!*\n\nZona: ${parsed.data.zoneApprox}, ${parsed.data.municipality}\n\nA equipa irá rever antes de publicar.\n\n[Ver caso](${caseUrl})`,
  ).catch(() => {})

  return NextResponse.json({ data: { id: sighting.id } }, { status: 201 })
}
