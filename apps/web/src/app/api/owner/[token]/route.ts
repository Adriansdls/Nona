import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendResolutionCelebration } from '@/lib/email/send'
import { captureOutcome } from '@/lib/outcomes'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select(
      'id, slug, status, dog_name, breed, primary_color, last_seen_municipality, last_seen_zone_approx, reporter_name, agent_name, agent_state, last_seen_at, created_at, resolved_at, behavioral_profile',
    )
    .eq('owner_token', token)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [eventsRes, assessmentRes, sightingsRes] = await Promise.all([
    supabase
      .from('case_agent_events')
      .select('action, tool, outcome, phase, created_at')
      .eq('case_id', caseRow.id as string)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('case_agent_assessments')
      .select('assessment, actions_taken, next_planned, phase, confidence, created_at')
      .eq('case_id', caseRow.id as string)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('sightings')
      .select('id, municipality, zone_approx, seen_at, is_public, description, direction, reliability_score, action_recommendation, owner_verdict, observed_time_confidence, observed_time_source, time_uncertainty_hours')
      .eq('case_id', caseRow.id as string)
      .order('seen_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    case: caseRow,
    events: eventsRes.data ?? [],
    assessment: assessmentRes.data?.[0] ?? null,
    sightings: sightingsRes.data ?? [],
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, slug, status, dog_name, reporter_email, reporter_name')
    .eq('owner_token', token)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (caseRow.status === 'resolvido') {
    return NextResponse.json({ already: true, slug: caseRow.slug })
  }

  await supabase
    .from('cases')
    .update({ status: 'resolvido', resolved_at: new Date().toISOString() })
    .eq('id', caseRow.id as string)

  // WS3: learning substrate — record what this resolved case looked like.
  await captureOutcome(supabase, caseRow.id as string)

  void sendResolutionCelebration({
    to: caseRow.reporter_email as string,
    reporterName: caseRow.reporter_name as string,
    caseSlug: caseRow.slug as string,
    dogName: caseRow.dog_name as string | null,
  }).catch((e) => console.warn('Resolution celebration email failed:', e))

  return NextResponse.json({ resolved: true, slug: caseRow.slug })
}
