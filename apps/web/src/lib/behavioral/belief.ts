// WP17: owner-confirmed evidence → belief update + posterior radius recompute.
// Mirrors apps/bot/agent/harness.py (score_sighting_lambda, recompute_posterior_radius,
// update_belief_from_sighting) so the web triage loop and the Python PI agent agree.

export type OwnerVerdict = 'confirmed' | 'rejected' | 'unsure'

export interface SightingEvidence {
  sighting_id: string
  lambda: number
  location_approx: string
  direction_of_travel?: string | null
  incorporated_at: string
  source?: 'owner_triage'
}

export interface LatLng { lat: number; lng: number }

export interface BeliefDistribution {
  scenarios?: unknown[]
  sighting_evidence?: SightingEvidence[]
  last_bayesian_update?: string | null
  posterior_radius_km?: number | null
  highest_probability_zone?: string | null
  highest_probability_coords?: LatLng | null
  direction_vector?: string | null
}

// Lambda weights — WiSAR-adapted (matches SIGHTING_LAMBDA in harness.py)
export const SIGHTING_LAMBDA = {
  camera: 0.95,
  owner_vetted: 0.75,
  clear_daylight: 0.70,
  brief_uncertain: 0.35,
  night: 0.30,
  secondhand: 0.25,
  crowd_degraded: 0.20,
} as const

/** An owner's verdict maps to a lambda weight. 'rejected' discards the evidence. */
export function verdictToLambda(verdict: OwnerVerdict): number {
  if (verdict === 'confirmed') return SIGHTING_LAMBDA.owner_vetted // 0.75
  if (verdict === 'unsure') return SIGHTING_LAMBDA.brief_uncertain // 0.35
  return 0 // rejected
}

/** Posterior search radius from confirmed evidence (mirrors recompute_posterior_radius). */
export function recomputePosteriorRadius(
  evidence: SightingEvidence[],
  baseRadiusKm: number,
  now: Date = new Date(),
): number {
  if (!evidence.length) return round1(baseRadiusKm)

  const strongest = evidence.reduce((a, b) => (b.lambda > a.lambda ? b : a))
  const factor = strongest.lambda >= 0.70 ? 0.4 : strongest.lambda >= 0.35 ? 0.7 : 1.0

  let widen = 1.0
  const anchored = Date.parse(strongest.incorporated_at)
  if (!Number.isNaN(anchored)) {
    const hoursSince = Math.max(0, (now.getTime() - anchored) / 3_600_000)
    widen = Math.pow(1.15, Math.floor(hoursSince / 48))
  }

  const posterior = Math.min(baseRadiusKm * factor * widen, baseRadiusKm * 1.5)
  return round1(Math.max(0.5, posterior))
}

/**
 * Apply an owner verdict to a behavioral profile. Returns the mutated profile.
 * confirmed/unsure → append/update evidence; rejected → remove this sighting's evidence.
 */
export function applyOwnerVerdict(
  profile: Record<string, unknown>,
  args: {
    sightingId: string
    zone: string
    coords?: LatLng | null
    direction?: string | null
    verdict: OwnerVerdict
    baseRadiusKm: number
  },
): Record<string, unknown> {
  const bd: BeliefDistribution = (profile['belief_distribution'] as BeliefDistribution) ?? {}
  const evidence = (bd.sighting_evidence ?? []).filter(e => e.sighting_id !== args.sightingId)

  if (args.verdict !== 'rejected') {
    const lam = verdictToLambda(args.verdict)
    evidence.push({
      sighting_id: args.sightingId,
      lambda: lam,
      location_approx: args.zone,
      direction_of_travel: args.direction ?? null,
      incorporated_at: new Date().toISOString(),
      source: 'owner_triage',
    })
  }

  bd.sighting_evidence = evidence
  bd.last_bayesian_update = new Date().toISOString()

  // Highest-probability zone = the strongest piece of evidence we still hold.
  const strongest = evidence.length ? evidence.reduce((a, b) => (b.lambda > a.lambda ? b : a)) : null
  if (strongest && strongest.lambda >= 0.70) {
    bd.highest_probability_zone = strongest.location_approx
    // Center for the posterior circle (WS4 map / WS6 ad geo-fence).
    if (args.verdict === 'confirmed' && args.coords) bd.highest_probability_coords = args.coords
    if (strongest.direction_of_travel) bd.direction_vector = strongest.direction_of_travel
  } else if (!evidence.length) {
    bd.highest_probability_zone = null
    bd.highest_probability_coords = null
  }

  bd.posterior_radius_km = recomputePosteriorRadius(evidence, args.baseRadiusKm)
  profile['belief_distribution'] = bd
  return profile
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
