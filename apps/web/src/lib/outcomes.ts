import type { SupabaseClient } from '@supabase/supabase-js'

// WS3 — capture a case outcome on resolution into case_outcomes (the WP14 learning
// substrate). One row per resolved case; populates as real cases close. The bot's
// recall_similar_outcomes reads it to surface what worked locally for similar dogs.
// Best-effort, never throws — must not block the resolution itself.

export async function captureOutcome(
  supabase: SupabaseClient,
  caseId: string,
): Promise<void> {
  try {
    const { data: c } = await supabase
      .from('cases')
      .select('id, last_seen_at, last_seen_municipality, last_seen_zone_approx, behavioral_profile')
      .eq('id', caseId)
      .single()
    if (!c) return

    const bp = (c.behavioral_profile as Record<string, unknown>) ?? {}
    const breedCategory = (bp['breed_category'] as string) ?? null
    const phaseState = (bp['phase_state'] as Record<string, unknown>) ?? {}
    const phaseAtRecovery = (phaseState['current'] as string) ?? null

    const lastSeen = c.last_seen_at as string | null
    const daysToRecovery = lastSeen
      ? Math.round(((Date.now() - new Date(lastSeen).getTime()) / 86_400_000) * 10) / 10
      : null

    const [eventsRes, sightingsRes] = await Promise.all([
      supabase.from('case_agent_events').select('action').eq('case_id', caseId),
      supabase.from('sightings').select('id', { count: 'exact', head: true }).eq('case_id', caseId),
    ])
    const actionsTaken = (eventsRes.data ?? []).map((r) => (r as { action: string }).action)

    await supabase.from('case_outcomes').upsert({
      case_id: caseId,
      breed_category: breedCategory,
      municipality: c.last_seen_municipality as string | null,
      zone: c.last_seen_zone_approx as string | null,
      phase_at_recovery: phaseAtRecovery,
      days_to_recovery: daysToRecovery,
      actions_taken: actionsTaken,
      sighting_count: sightingsRes.count ?? 0,
      recovered: true,
    }, { onConflict: 'case_id' })
  } catch (e) {
    console.warn('[WS3] captureOutcome failed (non-fatal):', e)
  }
}
