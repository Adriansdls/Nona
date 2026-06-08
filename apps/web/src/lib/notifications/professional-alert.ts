import { createServiceClient } from '@/lib/supabase/service'
import { sendProfessionalAlert } from '@/lib/email/send'

// WP18 — Two-tier minute-0 network alert.
//
// TIER 1 (this module): the SILENT professional network — canils, vets, shelters,
// AND approved clinic_partners (clinics get both email + Telegram PM).
// Fires ALWAYS, immediately at case creation, in parallel with the intake chat.
//
// TIER 2 (NOT here) — public / crowd / Facebook-group broadcast — stays gated by
// the WP9 action_gate in the PI agent.

export interface ProfessionalAlertResult {
  canils: number
  vets: number
  clinics: number
}

/**
 * Fire-and-forget Tier 1 alert. Only for 'perdido' cases. Never throws.
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
  const result: ProfessionalAlertResult = { canils: 0, vets: 0, clinics: 0 }
  if (args.caseType !== 'perdido') return result

  try {
    const supabase = createServiceClient()
    const [canilsRes, vetsRes, clinicsRes] = await Promise.all([
      supabase.from('kb_canils').select('name, email').eq('municipality', args.municipality).not('email', 'is', null),
      supabase.from('kb_vets').select('name, email').eq('municipality', args.municipality).not('email', 'is', null),
      supabase.from('clinic_partners')
        .select('name, contact_email, contact_telegram_id, intake_slug')
        .eq('municipality', args.municipality)
        .eq('is_approved', true),
    ])

    const canils = (canilsRes.data ?? []) as Array<{ name: string; email: string }>
    const vets = (vetsRes.data ?? []) as Array<{ name: string; email: string }>
    const clinics = (clinicsRes.data ?? []) as Array<{ name: string; contact_email: string | null; contact_telegram_id: string | null; intake_slug: string }>

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
      ...clinics.map(async (clinic) => {
        if (clinic.contact_email) {
          await sendProfessionalAlert({
            to: clinic.contact_email, orgName: clinic.name, orgKind: 'clinica',
            caseSlug: args.slug, dogName: args.dogName, breed: args.breed,
            primaryColor: args.primaryColor, municipality: args.municipality, zone: args.zone,
          }).then(() => { result.clinics++ })
            .catch((e) => console.warn(`[WP18] clinica alert failed (${clinic.name}):`, e))
          notifications.push({ case_id: args.caseId, channel: 'email', message: `Tier-1 alerta clinica → ${clinic.name} (${clinic.contact_email})`, phase: 'tier1_professional', sent_at: now })
        }
        if (clinic.contact_telegram_id) {
          const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''
          const tgMsg = `🔔 *Cão perdido na sua zona*
\n*${args.dogName ?? 'Cão sem nome'}* · ${args.breed} · ${args.primaryColor}\nPerdido em ${args.municipality}${args.zone ? ` (${args.zone})` : ''}.\n\nSe for apresentado na clínica, registe o chip em:\n${appUrl}/clinica/${clinic.intake_slug}\n\n🔗 Ver caso: ${appUrl}/caso/${args.slug}`
          void fetch(`${appUrl}/api/bot/notify-clinic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-token': process.env['INTERNAL_API_TOKEN'] ?? '' },
            body: JSON.stringify({ telegramId: clinic.contact_telegram_id, message: tgMsg }),
          }).catch(() => {})
        }
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
