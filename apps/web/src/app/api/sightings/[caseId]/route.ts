import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sightingCreateSchema } from '@/lib/validation/sighting.schema'
import { sendNewSighting } from '@/lib/email/send'

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
    .select('id, slug, reporter_email, reporter_name, last_seen_municipality')
    .eq('id', caseId)
    .eq('status', 'ativo')
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found or not active' }, { status: 404 })
  }

  const { data: sighting, error } = await supabase
    .from('sightings')
    .insert({
      case_id: caseId,
      seen_at: parsed.data.seenAt,
      municipality: parsed.data.municipality,
      zone_approx: parsed.data.zoneApprox,
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

  // Notify case reporter (non-fatal)
  try {
    await sendNewSighting({
      to: caseRow.reporter_email,
      reporterName: caseRow.reporter_name,
      caseSlug: caseRow.slug,
      municipality: parsed.data.municipality,
      zoneApprox: parsed.data.zoneApprox,
    })
  } catch (e) {
    console.warn('Sighting notification failed (non-fatal):', e)
  }

  return NextResponse.json({ data: { id: sighting.id } }, { status: 201 })
}
