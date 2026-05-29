// WP21 — Real Meta Ads Manager integration with radius-driven geo-targeting.
//
// The ad set's geo-fence is the WP17 posterior search radius centered on the
// highest-probability point (or last-seen). When the owner confirms a sighting
// and the radius recomputes, the ad set targeting updates to follow it.
//
// GATED by the WP9 action_gate exactly like the public/crowd broadcast (Tier 2):
// a fear-reactive dog (galgo phase_2) is never advertised to crowds.
//
// EXTERNAL DEPENDENCY: needs an ad account + budget + a token with `ads_management`.
//   FACEBOOK_AD_ACCOUNT_ID   e.g. "act_1234567890" (or bare id, we prefix)
//   FACEBOOK_ADS_ACCESS_TOKEN (ads_management scope)
//   FACEBOOK_ADS_CAMPAIGN_ID  parent campaign the ad sets live under
// Set META_ADS_DRY_RUN=1 to build + return the payload without calling Graph.

const GRAPH = 'https://graph.facebook.com/v19.0'

export interface ActionGateLike {
  broadcast_sighting_location?: 'public' | 'private_coordinator_only' | 'blocked'
  crowd_response_blocked?: boolean
}

export interface AdSyncArgs {
  caseId: string
  slug: string
  dogName: string | null
  municipality: string
  center: { lat: number; lng: number }
  radiusKm: number
  actionGate: ActionGateLike | null | undefined
  existingAdSetId?: string | null
  /** Daily budget in cents (minor units). Defaults to env or 500 (€5). */
  dailyBudgetCents?: number
}

export interface AdSyncResult {
  action: 'created' | 'updated' | 'skipped_gate' | 'skipped_no_creds' | 'dry_run'
  adSetId?: string | null
  reason?: string
  payload?: Record<string, unknown>
}

/**
 * Tier-2 gate: only advertise when public broadcast is allowed and crowds aren't
 * blocked. FAIL-SAFE: if no gate was ever computed (e.g. a form-created case that
 * never ran the behavioral assessment) we do NOT advertise — advertising a dog
 * whose temperament was never evaluated is exactly the WP9 error to avoid.
 */
export function isAdvertisingAllowed(gate: ActionGateLike | null | undefined): boolean {
  if (!gate) return false // unevaluated → fail safe, no crowd broadcast
  if (gate.crowd_response_blocked) return false
  return (gate.broadcast_sighting_location ?? 'blocked') === 'public'
}

/** Meta caps custom-location radius at 80km and floors near ~1km. Clamp + round. */
function clampRadiusKm(km: number): number {
  return Math.min(80, Math.max(1, Math.round(km)))
}

/** Build the targeting spec — a circular geo-fence around the search center. */
export function buildGeoTargeting(center: { lat: number; lng: number }, radiusKm: number) {
  return {
    geo_locations: {
      custom_locations: [
        {
          latitude: center.lat,
          longitude: center.lng,
          radius: clampRadiusKm(radiusKm),
          distance_unit: 'kilometer',
        },
      ],
    },
    age_min: 18,
  }
}

function adAccountPath(): string | null {
  const raw = process.env['FACEBOOK_AD_ACCOUNT_ID']
  if (!raw) return null
  return raw.startsWith('act_') ? raw : `act_${raw}`
}

/**
 * Create or update the ad set whose geo-fence follows the posterior radius.
 * Never throws — returns a structured result so callers can fire-and-forget.
 */
export async function syncCaseAdSet(args: AdSyncArgs): Promise<AdSyncResult> {
  if (!isAdvertisingAllowed(args.actionGate)) {
    return { action: 'skipped_gate', reason: 'action_gate blocks public/crowd broadcast' }
  }

  const account = adAccountPath()
  const token = process.env['FACEBOOK_ADS_ACCESS_TOKEN']
  const campaignId = process.env['FACEBOOK_ADS_CAMPAIGN_ID']
  const dryRun = process.env['META_ADS_DRY_RUN'] === '1'

  const targeting = buildGeoTargeting(args.center, args.radiusKm)
  const budget = args.dailyBudgetCents
    ?? Number(process.env['META_ADS_DAILY_BUDGET_CENTS'] ?? '500')

  // Update path: only the targeting changes when the radius moves.
  if (args.existingAdSetId) {
    const payload: Record<string, unknown> = { targeting }
    if (dryRun) return { action: 'dry_run', adSetId: args.existingAdSetId, payload }
    if (!account || !token) return { action: 'skipped_no_creds', reason: 'ads creds not set' }
    try {
      const res = await fetch(`${GRAPH}/${args.existingAdSetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: token }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) return { action: 'skipped_no_creds', reason: `ad set update ${res.status}: ${await res.text()}` }
      return { action: 'updated', adSetId: args.existingAdSetId }
    } catch (e) {
      return { action: 'skipped_no_creds', reason: `ad set update error: ${String(e)}` }
    }
  }

  // Create path: a new ad set under the parent campaign.
  const createPayload: Record<string, unknown> = {
    name: `SalvaCão · ${args.dogName ?? args.slug} · ${args.municipality}`,
    campaign_id: campaignId,
    daily_budget: budget,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'REACH',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    targeting,
    status: 'PAUSED', // start paused — a human enables spend
  }

  if (dryRun) return { action: 'dry_run', payload: createPayload }
  if (!account || !token || !campaignId) {
    return { action: 'skipped_no_creds', reason: 'FACEBOOK_AD_ACCOUNT_ID / token / campaign id not set' }
  }

  try {
    const res = await fetch(`${GRAPH}/${account}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...createPayload, access_token: token }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { action: 'skipped_no_creds', reason: `ad set create ${res.status}: ${await res.text()}` }
    const { id } = (await res.json()) as { id: string }
    return { action: 'created', adSetId: id }
  } catch (e) {
    return { action: 'skipped_no_creds', reason: `ad set create error: ${String(e)}` }
  }
}
