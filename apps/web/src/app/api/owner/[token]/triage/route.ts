import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { applyOwnerVerdict, type OwnerVerdict, type LatLng } from '@/lib/behavioral/belief'
import { recommendAdParams, type ActionGateLike } from '@/lib/social/meta-ads'

// Postgres point comes back as "(lng,lat)". Convert to {lat,lng}.
function parsePoint(p: unknown): LatLng | null {
  if (!p || typeof p !== 'string') return null
  const m = p.match(/\(([-\d.]+),([-\d.]+)\)/)
  if (!m) return null
  const lng = Number(m[1]); const lat = Number(m[2])
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

// WP17: owner triage of a candidate sighting (clearly yes / clearly no / don't know).
// Owner-authenticated via owner_token (privacy #6: visual matches never public).
// A verdict updates the belief distribution and recomputes the posterior radius.

const triageSchema = z.object({
  sightingId: z.string().uuid(),
  verdict: z.enum(['confirmed', 'rejected', 'unsure']),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const body = await req.json().catch(() => null)
  const parsed = triageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, slug, dog_name, last_seen_municipality, last_seen_zone_approx, last_seen_coords_approx, behavioral_profile, environment_profile')
    .eq('owner_token', token)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // The sighting must belong to this case (no cross-case triage).
  const { data: sighting } = await supabase
    .from('sightings')
    .select('id, zone_approx, direction, coords_approx')
    .eq('id', parsed.data.sightingId)
    .eq('case_id', caseRow.id as string)
    .single()

  if (!sighting) {
    return NextResponse.json({ error: 'Sighting not found for this case' }, { status: 404 })
  }

  const verdict = parsed.data.verdict as OwnerVerdict

  // Persist the verdict + credibility. NOTE: privacy #7 — a sighting is NOT made
  // public here. Owner confirm raises internal credibility and drives the belief
  // update; publication stays behind the existing admin review gate.
  await supabase
    .from('sightings')
    .update({
      owner_verdict: verdict,
      ...(verdict === 'confirmed' ? { credibility: 'alta' } : {}),
      ...(verdict === 'rejected' ? { credibility: 'baixa' } : {}),
    })
    .eq('id', sighting.id as string)

  // Update the belief distribution + posterior radius.
  const profile = (caseRow.behavioral_profile as Record<string, unknown>) ?? {}
  const env = (caseRow.environment_profile as Record<string, unknown>) ?? {}
  const baseRadiusKm = Number(env['search_radius_km']) || 5.0

  const updated = applyOwnerVerdict(profile, {
    sightingId: sighting.id as string,
    zone: (sighting.zone_approx as string) ?? '',
    coords: parsePoint(sighting.coords_approx),
    direction: (sighting.direction as string | null) ?? null,
    verdict,
    baseRadiusKm,
  })

  const bd = (updated['belief_distribution'] as Record<string, unknown>) ?? {}
  const radiusKm = Number(bd['posterior_radius_km']) || baseRadiusKm

  // WS-E: recompute the ad RECOMMENDATION (owner-pays model — params only, no spend,
  // no Graph call). The owner boosts the Nona Page post from their own FB. Gated by
  // action_gate inside recommendAdParams (Tier 2).
  const gate = ((profile['action_gate'] as ActionGateLike) ?? null)
  const hpc = bd['highest_probability_coords'] as LatLng | null | undefined
  const center = hpc ?? parsePoint(caseRow.last_seen_coords_approx)
  updated['ad_recommendation'] = recommendAdParams({
    radiusKm,
    center,
    zone: (bd['highest_probability_zone'] as string | null) ?? (caseRow.last_seen_zone_approx as string | null) ?? null,
    actionGate: gate,
  })

  await supabase
    .from('cases')
    .update({ behavioral_profile: updated })
    .eq('id', caseRow.id as string)

  return NextResponse.json({
    ok: true,
    verdict,
    posterior_radius_km: bd['posterior_radius_km'] ?? null,
    highest_probability_zone: bd['highest_probability_zone'] ?? null,
  })
}
