import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// WS2 — Telegram deep-link claim.
// A web-created case has owner_token but reporter_telegram_id=NULL, so the PI
// agent's push can't reach the owner. When the owner taps the handoff link
// (t.me/<bot>?start=<owner_token>), the bot calls this to BIND their telegram_id
// to the case. Idempotent: binds only if unclaimed (or already this id).
//
// Returns the case summary so the bot can greet as the case officer. It does NOT
// return a step sequence — the bot computes its own (single source of truth,
// apps/bot/agent/pi_tools.py build_step_sequence) to avoid web/bot divergence.

function checkInternalToken(req: NextRequest): boolean {
  const token = req.headers.get('x-internal-token')
  return !!token && token === process.env['INTERNAL_API_TOKEN']
}

export async function POST(req: NextRequest) {
  if (!checkInternalToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { owner_token?: string; telegram_id?: string } | null
  const ownerToken = body?.owner_token
  const telegramId = body?.telegram_id
  if (!ownerToken || !telegramId) {
    return NextResponse.json({ error: 'owner_token and telegram_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, slug, type, dog_name, breed, primary_color, last_seen_municipality, last_seen_zone_approx, last_seen_at, reporter_telegram_id, behavioral_profile')
    .eq('owner_token', ownerToken)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const existing = caseRow.reporter_telegram_id as string | null
  if (existing && existing !== telegramId) {
    // Claimed by a different Telegram account — refuse (bot falls back to welcome).
    return NextResponse.json({ error: 'Already claimed' }, { status: 409 })
  }

  if (!existing) {
    const { error } = await supabase
      .from('cases')
      .update({ reporter_telegram_id: telegramId })
      .eq('id', caseRow.id as string)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const lastSeenAt = caseRow.last_seen_at as string | null
  const hoursElapsed = lastSeenAt
    ? Math.max(0, (Date.now() - new Date(lastSeenAt).getTime()) / 3_600_000)
    : 0

  // is_hard (passive profile) — mirrors compute_action_gate: active search not
  // permitted, or crowd response blocked. The bot uses this + hours to build its
  // own step sequence (single source of truth).
  const bp = (caseRow.behavioral_profile as Record<string, unknown> | null) ?? {}
  const gate = (bp['action_gate'] as Record<string, unknown> | undefined) ?? {}
  const isHard = gate['active_search_permitted'] === false || gate['crowd_response_blocked'] === true

  return NextResponse.json({
    data: {
      slug: caseRow.slug,
      type: caseRow.type,
      dog_name: caseRow.dog_name,
      breed: caseRow.breed,
      primary_color: caseRow.primary_color,
      municipality: caseRow.last_seen_municipality,
      zone: caseRow.last_seen_zone_approx,
      hours_elapsed: hoursElapsed,
      is_hard: isHard,
      already_claimed: !!existing,
    },
  })
}
