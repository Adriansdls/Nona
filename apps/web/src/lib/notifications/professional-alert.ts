import { createServiceClient } from '@/lib/supabase/service'
import { sendProfessionalAlert } from '@/lib/email/send'

// WP18 — Two-tier minute-0 network alert.
//
// TIER 1 (this module): the SILENT professional network — canils, vets, shelters.
// Fires ALWAYS, immediately at case creation, in parallel with the intake chat.
// It is safe regardless of the dog's temperament: professionals consult the
// animals they receive, they do not go out and chase a frightened dog. This
// delivers the owner's "don't worry, everyone is already alerted" promise.
//
// TIER 2 (NOT here) — public / crowd / Facebook-group broadcast — stays gated by
// the WP9 action_gate in the PI agent. A fear-reactive dog (galgo phase_2) must
// never be mass-broadcast; that is the exact error WP9 exists to prevent.

export interface ProfessionalAlertResult {
  canils: number
  vets: number
}

/**
 * Fire-and-forget Tier 1 alert. Only for 'perdido' cases. Never throws —
 * failures are logged and swallowed so they can't block case creation.
 */
export async function fireProfessionalAlert(args: {
  caseId: string
  caseType: string
  slug: string
  dogName: string | null
  breed: string
  primaryColor: string
  municipality: string
  zone: string | null
}): Promise<ProfessionalAlertResult> {
  const result: ProfessionalAlertResult = { canils: 0, vets: 0 }
  if (args.caseType !== 'perdido') return result

  try {
    const supabase = createServiceClient()
    const [canilsRes, vetsRes] = await Promise.all([
      supabase.from('kb_canils').select('name, email').eq('municipality', args.municipality).not('email', 'is', null),
      supabase.from('kb_vets').select('name, email').eq('municipality', args.municipality).not('email', 'is', null),
    ])

    const canils = (canilsRes.data ?? []) as Array<{ name: string; email: string }>
    const vets = (vetsRes.data ?? []) as Array<{ name: string; email: string }>

    const now = new Date().toISOString()
    const notifications: Array<Record<string, unknown>> = []

    await Promise.all([
      ...canils.map(async (org) => {
        await sendProfessionalAlert({
          to: org.email, orgName: org.name, orgKind: 'canil',
          caseSlug: args.slug, dogName: args.dogName, breed: args.breed,
          primaryColor: args.primaryColor, municipality: args.municipality, zone: args.zone,
        }).then(() => { result.canils++ })
          .catch((e) => console.warn(`[WP18] canil alert failed (${org.name}):`, e))
        notifications.push({ case_id: args.caseId, channel: 'email', message: `Tier-1 alerta canil → ${org.name} (${org.email})`, phase: 'tier1_professional', sent_at: now })
      }),
      ...vets.map(async (org) => {
        await sendProfessionalAlert({
          to: org.email, orgName: org.name, orgKind: 'vet',
          caseSlug: args.slug, dogName: args.dogName, breed: args.breed,
          primaryColor: args.primaryColor, municipality: args.municipality, zone: args.zone,
        }).then(() => { result.vets++ })
          .catch((e) => console.warn(`[WP18] vet alert failed (${org.name}):`, e))
        notifications.push({ case_id: args.caseId, channel: 'email', message: `Tier-1 alerta vet → ${org.name} (${org.email})`, phase: 'tier1_professional', sent_at: now })
      }),
    ])

    if (notifications.length) {
      await supabase.from('case_notifications').insert(notifications).then(() => {},
        (e: unknown) => console.warn('[WP18] notification log failed:', e))
    }
  } catch (e) {
    console.warn('[WP18] professional alert error (non-fatal):', e)
  }

  return result
}
