'use client'
import React, { useState, useEffect } from 'react'
import { N } from './tokens'
import { createClient } from '@/lib/supabase/client'

/**
 * The OWNER's powers, folded onto the public case page (rendered only when the
 * owner opens it with ?t=<owner_token> AND the owner fetch succeeded).
 *
 * ProtocolBand owner-mode is the *plan* ("o que fazer agora"); OwnerPanel is the
 * *powers* — the things only the owner can do on their own case:
 *   • act-on-case (primary): triage sightings (é o meu cão?), mark resolved.
 *   • relief + admin (secondary): see what Nona did/plans, save to account, boost.
 *
 * Every mutation still verifies the token server-side (the ?t= is unvalidated on
 * the client by design); a bogus token returns 404 on the GET and this never mounts.
 */

export type OwnerData = {
  case: {
    slug: string
    status: string
    dog_name: string | null
    breed: string
    primary_color: string
    last_seen_municipality: string
    last_seen_zone_approx: string
    reporter_name: string
    agent_name: string | null
    agent_state: string | null
    last_seen_at: string
    created_at: string
    resolved_at: string | null
    fb_post_id?: string | null
    behavioral_profile?: {
      ad_recommendation?: {
        eligible?: boolean; radiusKm?: number; zone?: string | null
        ageMin?: number; dailyBudgetEur?: number; rationale?: string
      } | null
    } | null
  }
  events: Array<{ action: string; tool: string; outcome: string; phase: string; created_at: string }>
  assessment: {
    assessment: string; actions_taken: string[]; next_planned: string[]
    phase: string; confidence: string; created_at: string
  } | null
  sightings: Array<{
    id: string
    municipality: string
    zone_approx: string
    seen_at: string
    is_public: boolean
    description: string | null
    direction?: string | null
    reliability_score?: number | null
    action_recommendation?: string | null
    owner_verdict?: 'confirmed' | 'rejected' | 'unsure' | null
    observed_time_confidence?: 'exact' | 'approximate' | 'unknown' | null
    observed_time_source?: 'firsthand' | 'social_post' | 'secondhand' | null
    time_uncertainty_hours?: number | null
  }>
}

// ─── helpers (moved from DashboardClient) ─────────────────────────────────
function hoursAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'há menos de 1h'
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d ${h % 24}h`
}

// WP16: honest observation-time string — never present an uncertain/social time
// as if precise; surface the ± band and the source.
function honestSeenLabel(s: {
  seen_at: string; time_uncertainty_hours?: number | null; observed_time_source?: string | null
}): string {
  const base = hoursAgo(s.seen_at)
  const band = s.time_uncertainty_hours ?? 0
  const srcLabel =
    s.observed_time_source === 'social_post' ? 'post social'
    : s.observed_time_source === 'secondhand' ? 'em segunda mão'
    : null
  const parts: string[] = []
  if (band >= 1) parts.push(`±${Math.round(band)}h`)
  if (srcLabel) parts.push(srcLabel)
  return parts.length ? `visto ${base} (${parts.join(' · ')})` : `visto ${base}`
}

function actionLabel(action: string): string {
  if (action.startsWith('notified_canil_')) return `Canil notificado · ${action.slice(15).replace(/_/g, ' ')}`
  if (action.startsWith('notified_vet_')) return `Vet notificado · ${action.slice(13).replace(/_/g, ' ')}`
  if (action.startsWith('posted_channel_')) return `Publicado em · ${action.slice(15).replace(/_/g, ' ')}`
  if (action.startsWith('guidance_')) return `Orientação · ${action.slice(9).replace(/_/g, ' ')}`
  if (action.startsWith('owner_brief_')) return `Mensagem enviada · ${action.slice(12).replace(/_/g, ' ')}`
  if (action.startsWith('volunteer_alert_')) return `Alerta voluntários · ${action.slice(16)}`
  if (action === 'case_assessment_updated') return 'Avaliação do caso actualizada'
  return action.replace(/_/g, ' ')
}

function phaseBadge(phase: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    panic:    { label: 'pânico',        bg: N.roseBg,   color: N.rose },
    survival: { label: 'sobrevivência', bg: N.amberBg,  color: N.amber },
    recovery: { label: 'recuperação',   bg: N.indigoBg, color: N.indigo },
  }
  const p = map[phase] ?? { label: phase, bg: N.surface, color: N.ink3 }
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: p.bg, color: p.color, fontSize: 10.5, fontFamily: N.mono, fontWeight: 600, letterSpacing: '0.05em' }}>
      {p.label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: '0 0 10px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
      {children}
    </h3>
  )
}

export function OwnerPanel({
  token, locale, dogName, ownerData, isMobile, onResolved,
}: {
  token: string
  locale: string
  dogName: string
  ownerData: OwnerData
  isMobile: boolean
  onResolved?: () => void
}) {
  const { case: c, events, assessment, sightings } = ownerData
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(c.status === 'resolvido')

  // WP17: owner triage of sightings (clearly yes / no / don't know).
  const [verdicts, setVerdicts] = useState<Record<string, 'confirmed' | 'rejected' | 'unsure'>>(() => {
    const seed: Record<string, 'confirmed' | 'rejected' | 'unsure'> = {}
    for (const s of sightings) if (s.owner_verdict) seed[s.id] = s.owner_verdict
    return seed
  })
  const [triaging, setTriaging] = useState<string | null>(null)
  const [posterior, setPosterior] = useState<{ radiusKm: number | null; zone: string | null } | null>(null)

  async function handleTriage(sightingId: string, verdict: 'confirmed' | 'rejected' | 'unsure') {
    setTriaging(sightingId)
    try {
      const res = await fetch(`/api/owner/${token}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sightingId, verdict }),
      })
      if (res.ok) {
        const body = await res.json() as { posterior_radius_km: number | null; highest_probability_zone: string | null }
        setVerdicts(prev => ({ ...prev, [sightingId]: verdict }))
        setPosterior({ radiusKm: body.posterior_radius_km, zone: body.highest_probability_zone })
      }
    } finally {
      setTriaging(null)
    }
  }

  // WS-F: optional account, post-acute (magic-link). On return from the email link
  // (authenticated), auto-link the case to the session.
  const [connectEmail, setConnectEmail] = useState('')
  const [connectState, setConnectState] = useState<'idle' | 'sent' | 'linked' | 'error'>('idle')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const res = await fetch(`/api/owner/${token}/connect`, { method: 'POST' })
      if (res.ok) setConnectState('linked')
    }).catch(() => {})
  }, [token])

  async function sendMagicLink() {
    if (!connectEmail.trim()) return
    setConnecting(true)
    try {
      const supabase = createClient()
      // Land back on the unified case page (?t=token) so this panel re-mounts and
      // the auto-link useEffect above fires.
      const next = `/${locale}/caso/${c.slug}?t=${token}&connect=1`
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signInWithOtp({
        email: connectEmail.trim(),
        options: { emailRedirectTo: redirect },
      })
      setConnectState(error ? 'error' : 'sent')
    } finally {
      setConnecting(false)
    }
  }

  async function handleResolve() {
    if (!confirm(`Confirmar: ${dogName} foi encontrado?`)) return
    setResolving(true)
    try {
      const res = await fetch(`/api/owner/${token}`, { method: 'POST' })
      if (res.ok) { setResolved(true); onResolved?.() }
    } finally {
      setResolving(false)
    }
  }

  const adRec = c.behavioral_profile?.ad_recommendation
  // Only offer boost when there's an actual Nona FB post to boost — otherwise the
  // button links nowhere useful and the "promove o anúncio" copy is misleading.
  const canBoost = !!adRec?.eligible && !!c.fb_post_id
  const boostUrl = `https://www.facebook.com/${c.fb_post_id}`

  return (
    <section style={{ padding: `8px ${isMobile ? '16px' : '32px'} 36px`, scrollMarginTop: 16 }} id="painel">
      {/* owner zone marker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: N.indigo, flexShrink: 0 }} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          o teu painel · privado · só tu vês isto
        </span>
      </div>

      {/* Resolution celebration */}
      {resolved && (
        <div style={{ marginBottom: 24, padding: '24px 28px', background: N.emeraldBg, border: `1px solid ${N.emerald}33`, borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: N.display, fontSize: 28, fontWeight: 400, color: N.emeraldDeep }}>{dogName} foi encontrado!</div>
          <div style={{ marginTop: 8, fontSize: 14, color: N.emeraldDeep, opacity: 0.8 }}>Que alegria. Obrigado por usar a Nona.</div>
        </div>
      )}

      {!resolved && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: isMobile ? 20 : 28, alignItems: 'start' }}>

          {/* ── ACT ON THE CASE (primary): sighting triage ── */}
          <div>
            <SectionLabel>Avistamentos — é o teu cão?</SectionLabel>
            {posterior && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: N.indigoBg, border: `1px solid ${N.indigo}33`, borderRadius: 10, fontSize: 12.5, color: N.indigo }}>
                Zona de busca actualizada{posterior.zone ? ` · foco: ${posterior.zone}` : ''}{posterior.radiusKm != null ? ` · raio ${posterior.radiusKm}km` : ''}
              </div>
            )}
            {sightings.length === 0 ? (
              <div style={{ padding: '20px 18px', textAlign: 'center', color: N.ink3, fontSize: 13.5, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
                Ainda sem avistamentos. Quando alguém reportar, aparece aqui para confirmares.
              </div>
            ) : (
              <div style={{ border: `1px solid ${N.rule}`, borderRadius: 12, overflow: 'hidden' }}>
                {sightings.map((s, i) => {
                  const verdict = verdicts[s.id]
                  return (
                    <div key={s.id} style={{
                      padding: '12px 16px',
                      borderBottom: i < sightings.length - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                      background: N.white,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, color: N.ink, fontWeight: 500 }}>{s.zone_approx}, {s.municipality}</span>
                        <span style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono, textAlign: 'right' }}>{honestSeenLabel(s)}</span>
                      </div>
                      {s.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: N.ink3, lineHeight: 1.5 }}>{s.description}</p>
                      )}
                      {verdict ? (
                        <div style={{ marginTop: 8, fontSize: 12, fontFamily: N.mono, color: verdict === 'confirmed' ? N.emerald : verdict === 'rejected' ? N.rose : N.ink3 }}>
                          {verdict === 'confirmed' ? '✓ confirmado por ti' : verdict === 'rejected' ? '✕ não é o teu cão' : '? não tens a certeza'}
                        </div>
                      ) : (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, color: N.ink4, marginBottom: 6 }}>É o teu cão?</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {([
                              { v: 'confirmed' as const, label: 'Sim, é ele', bg: N.emerald, fg: N.white },
                              { v: 'unsure' as const, label: 'Não sei', bg: N.surface, fg: N.ink2 },
                              { v: 'rejected' as const, label: 'Não é', bg: N.surface, fg: N.ink2 },
                            ]).map(b => (
                              <button key={b.v} disabled={triaging === s.id}
                                onClick={() => handleTriage(s.id, b.v)}
                                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${N.rule}`, background: b.bg, color: b.fg, fontSize: 12.5, fontWeight: 500, fontFamily: N.sans, cursor: triaging === s.id ? 'default' : 'pointer', opacity: triaging === s.id ? 0.6 : 1 }}>
                                {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── RELIEF + ADMIN (secondary): what Nona did, save, boost ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* PI assessment */}
            {assessment && (
              <div>
                <SectionLabel>O que a Nona está a fazer por ti</SectionLabel>
                <div style={{ padding: '16px 18px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    {phaseBadge(assessment.phase)}
                    <span style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono }}>{hoursAgo(assessment.created_at)}</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 14.5, lineHeight: 1.6, color: N.ink }}>{assessment.assessment}</p>
                  {assessment.next_planned.length > 0 && (
                    <>
                      <div style={{ fontSize: 10.5, fontFamily: N.mono, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>próximas acções</div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                        {assessment.next_planned.map((item, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: N.ink2, lineHeight: 1.5 }}>
                            <span style={{ color: N.ink4, flexShrink: 0 }}>→</span>{item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Agent activity log */}
            {events.length > 0 && (
              <div>
                <SectionLabel>Registo de acções ({events.length})</SectionLabel>
                <div style={{ border: `1px solid ${N.rule}`, borderRadius: 12, overflow: 'hidden' }}>
                  {events.slice(0, 8).map((ev, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px',
                      borderBottom: i < Math.min(events.length, 8) - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                      background: N.white,
                    }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>{phaseBadge(ev.phase)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: N.ink, fontWeight: 500 }}>{actionLabel(ev.action)}</div>
                        {ev.outcome && !ev.outcome.startsWith('{') && (
                          <div style={{ fontSize: 11.5, color: N.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.outcome.replace('[STUB] Would ', '').slice(0, 120)}
                          </div>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 10.5, color: N.ink4, fontFamily: N.mono }}>{hoursAgo(ev.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WS-F: warm post-acute connect */}
            {connectState !== 'linked' ? (
              <div style={{ padding: '16px 18px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
                <h4 style={{ margin: '0 0 6px', fontFamily: N.display, fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', color: N.ink }}>
                  Não percas o {dogName}.
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: N.ink2, lineHeight: 1.5 }}>
                  Guarda a busca na tua conta e recebe avisos por email — nunca perdes o acesso a esta página.
                </p>
                {connectState === 'sent' ? (
                  <p style={{ margin: 0, fontSize: 13, color: N.emeraldDeep, background: N.emeraldBg, padding: '10px 12px', borderRadius: 8 }}>
                    ✓ Enviámos-te um link por email. Abre-o para guardares a busca do {dogName}.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input type="email" value={connectEmail} onChange={e => setConnectEmail(e.target.value)}
                      placeholder="o teu email"
                      style={{ flex: 1, minWidth: 160, padding: '10px 13px', borderRadius: 9, border: `1px solid ${N.rule}`, fontSize: 14, color: N.ink, fontFamily: N.sans }} />
                    <button onClick={sendMagicLink} disabled={!connectEmail.trim() || connecting}
                      style={{ padding: '10px 16px', borderRadius: 9, border: 'none', background: (connectEmail.trim() && !connecting) ? N.ink : N.rule, color: (connectEmail.trim() && !connecting) ? N.paper : N.ink4, fontSize: 13.5, fontWeight: 600, cursor: (connectEmail.trim() && !connecting) ? 'pointer' : 'default', fontFamily: N.sans }}>
                      {connecting ? 'A enviar…' : 'Guardar'}
                    </button>
                  </div>
                )}
                {connectState === 'error' && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: N.rose }}>Não foi possível enviar. Tenta de novo.</p>}
              </div>
            ) : (
              <div style={{ padding: '12px 16px', background: N.emeraldBg, border: `1px solid ${N.emerald}33`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, color: N.emeraldDeep }}>✓ Busca guardada na tua conta.</span>
                <a href={`/${locale}/meus-caes`} style={{ fontSize: 13, color: N.emeraldDeep, textDecoration: 'none', fontWeight: 600 }}>
                  Os cães que procuras →
                </a>
              </div>
            )}

            {/* WS-E: owner-pays Boost — only when ads are allowed AND a post exists */}
            {canBoost && (
              <div style={{ padding: '16px 18px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
                <h4 style={{ margin: '0 0 6px', fontFamily: N.display, fontWeight: 400, fontSize: 18, letterSpacing: '-0.01em', color: N.ink }}>
                  Promover no Facebook
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: N.ink2, lineHeight: 1.5 }}>
                  O pagamento é teu, direto ao Meta. A Nona prepara o anúncio certo — tu só confirmas e pagas.
                </p>
                <div style={{ background: N.surface, borderRadius: 10, padding: '11px 13px', marginBottom: 12, fontSize: 12.5, color: N.ink2, lineHeight: 1.6 }}>
                  <div><strong style={{ color: N.ink }}>Raio:</strong> {adRec.radiusKm}km{adRec.zone ? ` · ${adRec.zone}` : ''}</div>
                  <div><strong style={{ color: N.ink }}>Público:</strong> {adRec.ageMin ?? 18}+ na zona</div>
                  <div><strong style={{ color: N.ink }}>Orçamento sugerido:</strong> ~€{adRec.dailyBudgetEur}/dia</div>
                  {adRec.rationale && <div style={{ marginTop: 4, fontStyle: 'italic', color: N.ink3 }}>{adRec.rationale}</div>}
                </div>
                <a href={boostUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 9, background: N.ink, color: N.paper, textDecoration: 'none', fontSize: 13.5, fontWeight: 600 }}>
                  Promover no Facebook →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve — the owner's biggest button */}
      {!resolved && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          style={{
            marginTop: 24, width: '100%', padding: '16px 24px', borderRadius: 12,
            background: resolving ? N.surface : N.emerald,
            color: resolving ? N.ink3 : N.white,
            border: 'none', cursor: resolving ? 'default' : 'pointer',
            fontSize: 16, fontWeight: 600, fontFamily: N.sans, transition: 'background 0.15s',
          }}
        >
          {resolving ? 'A processar…' : `🎉 ${dogName} foi encontrado!`}
        </button>
      )}
    </section>
  )
}
