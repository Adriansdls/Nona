import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'

// WS3 web fallback — owner marks a guided step done from the dashboard (non-Telegram
// path). Owner-token authenticated (same pattern as triage). Advances
// behavioral_profile.guided_flow.step_index — the same JSONB the bot stepper writes,
// so the two channels share one progress record.

const schema = z.object({
  stepIndex: z.number().int().min(0),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, last_seen_at, behavioral_profile')
    .eq('owner_token', token)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const bp = (caseRow.behavioral_profile as Record<string, unknown>) ?? {}
  const gf = (bp['guided_flow'] as Record<string, unknown>) ?? {}
  const completed = new Set<number>((gf['completed'] as number[]) ?? [])
  completed.add(parsed.data.stepIndex)

  // Pin bucket/is_hard once so reloads after a time-boundary cross don't switch
  // protocols (mirrors the bot stepper). Compute only if not already pinned.
  let bucket = gf['bucket'] as string | undefined
  let isHard = gf['is_hard'] as boolean | undefined
  if (bucket === undefined) {
    const lastSeen = caseRow.last_seen_at as string | null
    const hours = lastSeen ? Math.max(0, (Date.now() - new Date(lastSeen).getTime()) / 3_600_000) : 0
    bucket = hours < 6 ? 'h0_6' : hours < 24 ? 'h6_24' : hours < 96 ? 'd2_4' : hours < 240 ? 'd5_10' : 'd10_plus'
    const gate = (bp['action_gate'] as Record<string, unknown> | undefined) ?? {}
    isHard = gate['active_search_permitted'] === false || gate['crowd_response_blocked'] === true
  }

  bp['guided_flow'] = {
    ...gf,
    step_index: parsed.data.stepIndex + 1,
    completed: [...completed].sort((a, b) => a - b),
    bucket,
    is_hard: isHard ?? false,
    started_at: (gf['started_at'] as string) ?? new Date().toISOString(),
  }

  await supabase.from('cases').update({ behavioral_profile: bp }).eq('id', caseRow.id as string)

  return NextResponse.json({ ok: true, step_index: parsed.data.stepIndex + 1 })
}
