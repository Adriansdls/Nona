'use client'

import React, { useState, useEffect } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { buildStepSequence, bucketFromHours } from '@/lib/guided/sequencer'
import { createClient } from '@/lib/supabase/client'

type DashboardData = {
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
    behavioral_profile?: {
      action_gate?: { active_search_permitted?: boolean; crowd_response_blocked?: boolean }
      guided_flow?: { step_index?: number; completed?: number[]; bucket?: string; is_hard?: boolean }
    } | null
  }
  events: Array<{
    action: string
    tool: string
    outcome: string
    phase: string
    created_at: string
  }>
  assessment: {
    assessment: string
    actions_taken: string[]
    next_planned: string[]
    phase: string
    confidence: string
    created_at: string
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

// WP16: honest observation-time string. Never present an uncertain/social time as
// if it were precise — surface the ± band and the source so the owner isn't misled
// the way a Facebook "há 2h" (really ~10h old) misleads.
function honestSeenLabel(s: {
  seen_at: string
  time_uncertainty_hours?: number | null
  observed_time_source?: string | null
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

function hoursAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'há menos de 1h'
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d ${h % 24}h`
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
    panic:    { label: 'pânico',    bg: N.roseBg,    color: N.rose },
    survival: { label: 'sobrevivência', bg: N.amberBg, color: N.amber },
    recovery: { label: 'recuperação',   bg: N.indigoBg, color: N.indigo },
  }
  const p = map[phase] ?? { label: phase, bg: N.surface, color: N.ink3 }
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: p.bg, color: p.color, fontSize: 10.5, fontFamily: N.mono, fontWeight: 600, letterSpacing: '0.05em' }}>
      {p.label}
    </span>
  )
}

export function DashboardClient({ data, locale, token }: { data: DashboardData; locale: string; token: string }) {
  const { case: c, events, assessment, sightings } = data
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

  // WS3 web fallback — guided steps as a check-off list (non-Telegram path).
  // Prefer the bucket pinned in guided_flow (set when the flow first started, on
  // either channel) so a page reload after a time-boundary cross doesn't switch
  // protocols and misalign completed[] indices. Falls back to elapsed-time bucket.
  const gf0 = c.behavioral_profile?.guided_flow
  const gate = c.behavioral_profile?.action_gate
  const isHard = gf0?.is_hard ?? (!!gate && (gate.crowd_response_blocked === true || gate.active_search_permitted === false))
  const hoursElapsed = c.last_seen_at
    ? Math.max(0, (Date.now() - new Date(c.last_seen_at).getTime()) / 3_600_000)
    : 0
  const activeBucket = (gf0?.bucket as ReturnType<typeof bucketFromHours> | undefined) ?? bucketFromHours(hoursElapsed)
  const guidedSteps = buildStepSequence(activeBucket, isHard)
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(c.behavioral_profile?.guided_flow?.completed ?? []),
  )
  const [steppingIdx, setSteppingIdx] = useState<number | null>(null)

  async function handleStepDone(stepIndex: number) {
    setSteppingIdx(stepIndex)
    try {
      const res = await fetch(`/api/owner/${token}/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepIndex }),
      })
      if (res.ok) setCompleted(prev => new Set(prev).add(stepIndex))
    } finally {
      setSteppingIdx(null)
    }
  }

  const dogLabel = c.dog_name ?? 'Cão sem nome'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // WS-F: optional account, post-acute (magic-link). Offered only after the owner
  // has done the first guided step. On return from the email link (authenticated),
  // auto-link the case to their account.
  const [connectEmail, setConnectEmail] = useState('')
  const [connectState, setConnectState] = useState<'idle' | 'sent' | 'linked' | 'error'>('idle')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    // returning from the magic link → link this case to the session
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
      const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/${locale}/meu-caso/${token}?connect=1`)}`
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
    if (!confirm(`Confirmar: ${dogLabel} foi encontrado?`)) return
    setResolving(true)
    try {
      const res = await fetch(`/api/owner/${token}`, { method: 'POST' })
      if (res.ok) setResolved(true)
    } finally {
      setResolving(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: N.paper, color: N.ink, fontFamily: N.sans }}>
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          painel do dono · privado
        </span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Resolution celebration */}
        {resolved && (
          <div style={{ marginBottom: 32, padding: '24px 28px', background: N.emeraldBg, border: `1px solid ${N.emerald}33`, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: N.display, fontSize: 28, fontWeight: 400, color: N.emeraldDeep }}>{dogLabel} foi encontrado!</div>
            <div style={{ marginTop: 8, fontSize: 14, color: N.emeraldDeep, opacity: 0.8 }}>Que alegria. Obrigado por usar o SalvaCão.</div>
          </div>
        )}

        {/* Case header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 999,
              background: resolved ? N.emeraldBg : N.amberBg,
              color: resolved ? N.emeraldDeep : N.amber,
              fontSize: 11, fontFamily: N.mono, fontWeight: 600,
            }}>
              {resolved ? 'resolvido' : 'ativo'}
            </span>
            {c.agent_name && (
              <span style={{ fontSize: 12, color: N.ink3, fontFamily: N.mono }}>
                investigador: {c.agent_name}
              </span>
            )}
          </div>

          <h1 style={{ margin: '0 0 4px', fontFamily: N.display, fontWeight: 400, fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {dogLabel}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: N.ink3 }}>
            {c.breed} · {c.primary_color} · {c.last_seen_municipality}
            {c.last_seen_zone_approx && ` · ${c.last_seen_zone_approx}`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: N.ink4, fontFamily: N.mono }}>
            desaparecido {hoursAgo(c.last_seen_at)} · caso aberto {hoursAgo(c.created_at)}
          </p>
        </div>

        {/* WS3 web fallback — guided steps (one-action checklist) */}
        {!resolved && guidedSteps.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
              O que fazer agora
            </h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: N.ink3 }}>
              Uma ação de cada vez. Marca quando fizeres.{' '}
              <a href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? 'salvacao_bot'}?start=${token}`} style={{ color: N.indigo, textDecoration: 'none' }}>
                Preferes no Telegram? →
              </a>
            </p>
            <div style={{ border: `1px solid ${N.rule}`, borderRadius: 12, overflow: 'hidden' }}>
              {guidedSteps.map((step, i) => {
                const done = completed.has(step.idx)
                const isWait = step.kind === 'wait'
                return (
                  <div key={step.idx} style={{
                    padding: '12px 16px',
                    borderBottom: i < guidedSteps.length - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                    background: isWait ? N.surface : N.white,
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    {isWait ? (
                      <span style={{ flexShrink: 0, fontSize: 15, marginTop: 1 }}>⏳</span>
                    ) : (
                      <button
                        onClick={() => !done && handleStepDone(step.idx)}
                        disabled={done || steppingIdx === step.idx}
                        style={{
                          flexShrink: 0, marginTop: 1, width: 22, height: 22, borderRadius: 6,
                          border: `1.5px solid ${done ? N.emerald : N.rule}`,
                          background: done ? N.emerald : N.white,
                          cursor: done ? 'default' : 'pointer', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}>
                        {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={N.white} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12.5 9 17.5 20 6.5"/></svg>}
                      </button>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, color: done ? N.ink3 : N.ink, lineHeight: 1.5, textDecoration: done ? 'line-through' : 'none' }}>
                        {step.title}
                      </p>
                      {step.why && (
                        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: N.ink3, fontStyle: 'italic', lineHeight: 1.45 }}>{step.why}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* PI Assessment */}
        {assessment && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
              Avaliação do investigador
            </h2>
            <div style={{ padding: '16px 20px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {phaseBadge(assessment.phase)}
                <span style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono }}>{hoursAgo(assessment.created_at)}</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.6, color: N.ink }}>{assessment.assessment}</p>
              {assessment.next_planned.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontFamily: N.mono, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>próximas acções</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                    {assessment.next_planned.map((item, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13.5, color: N.ink2, lineHeight: 1.5 }}>
                        <span style={{ color: N.ink4, flexShrink: 0 }}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        )}

        {/* Agent activity log */}
        {events.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
              O que estamos a fazer ({events.length})
            </h2>
            <div style={{ border: `1px solid ${N.rule}`, borderRadius: 12, overflow: 'hidden' }}>
              {events.slice(0, 15).map((ev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px',
                  borderBottom: i < Math.min(events.length, 15) - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                  background: N.white,
                }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{phaseBadge(ev.phase)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: N.ink, fontWeight: 500 }}>{actionLabel(ev.action)}</div>
                    {ev.outcome && !ev.outcome.startsWith('{') && (
                      <div style={{ fontSize: 12, color: N.ink3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.outcome.replace('[STUB] Would ', '').slice(0, 120)}
                      </div>
                    )}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, color: N.ink4, fontFamily: N.mono }}>{hoursAgo(ev.created_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sightings + owner triage */}
        {sightings.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
              Avistamentos ({sightings.length})
            </h2>
            {posterior && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: N.indigoBg, border: `1px solid ${N.indigo}33`, borderRadius: 10, fontSize: 12.5, color: N.indigo }}>
                Zona de busca actualizada{posterior.zone ? ` · foco: ${posterior.zone}` : ''}{posterior.radiusKm != null ? ` · raio ${posterior.radiusKm}km` : ''}
              </div>
            )}
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
                    {/* WP17 triage: did the owner recognise their dog? */}
                    {verdict ? (
                      <div style={{ marginTop: 8, fontSize: 12, fontFamily: N.mono, color: verdict === 'confirmed' ? N.emerald : verdict === 'rejected' ? N.rose : N.ink3 }}>
                        {verdict === 'confirmed' ? '✓ confirmado por si' : verdict === 'rejected' ? '✕ não é o seu cão' : '? não tem a certeza'}
                      </div>
                    ) : (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: N.ink4, marginBottom: 6 }}>É o seu cão?</div>
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
          </section>
        )}

        {sightings.length === 0 && events.length === 0 && !assessment && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: N.ink3, fontSize: 14, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, marginBottom: 28 }}>
            O investigador está a analisar o caso. Volte em breve.
          </div>
        )}

        {/* WS-F: warm post-acute connect — only after the first action is done */}
        {!resolved && completed.size > 0 && connectState !== 'linked' && (
          <div style={{ marginBottom: 28, padding: '18px 20px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: N.display, fontWeight: 400, fontSize: 20, letterSpacing: '-0.01em', color: N.ink }}>
              Não percas o {dogLabel}.
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, color: N.ink2, lineHeight: 1.5 }}>
              Guarda a busca na tua conta e recebe avisos por email. Assim nunca perdes o acesso a esta página.
            </p>
            {connectState === 'sent' ? (
              <p style={{ margin: 0, fontSize: 13.5, color: N.emeraldDeep, background: N.emeraldBg, padding: '10px 12px', borderRadius: 8 }}>
                ✓ Enviámos-te um link por email. Abre-o para guardares a busca do {dogLabel}.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input type="email" value={connectEmail} onChange={e => setConnectEmail(e.target.value)}
                  placeholder="o teu email"
                  style={{ flex: 1, minWidth: 180, padding: '11px 14px', borderRadius: 9, border: `1px solid ${N.rule}`, fontSize: 14.5, color: N.ink, fontFamily: N.sans }} />
                <button onClick={sendMagicLink} disabled={!connectEmail.trim() || connecting}
                  style={{ padding: '11px 18px', borderRadius: 9, border: 'none', background: (connectEmail.trim() && !connecting) ? N.ink : N.rule, color: (connectEmail.trim() && !connecting) ? N.paper : N.ink4, fontSize: 14, fontWeight: 600, cursor: (connectEmail.trim() && !connecting) ? 'pointer' : 'default', fontFamily: N.sans }}>
                  {connecting ? 'A enviar…' : 'Guardar'}
                </button>
              </div>
            )}
            {connectState === 'error' && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: N.rose }}>Não foi possível enviar. Tenta de novo.</p>}
          </div>
        )}
        {connectState === 'linked' && (
          <div style={{ marginBottom: 28, padding: '12px 16px', background: N.emeraldBg, border: `1px solid ${N.emerald}33`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: N.emeraldDeep }}>✓ Busca guardada na tua conta.</span>
            <a href={`/${locale}/meus-caes`} style={{ fontSize: 13, color: N.emeraldDeep, textDecoration: 'none', fontWeight: 600 }}>
              Os cães que procuras →
            </a>
          </div>
        )}

        {/* Public case link */}
        <div style={{ marginBottom: 28, padding: '12px 16px', background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: N.ink3 }}>Página pública do caso</span>
          <a href={`/${locale}/caso/${c.slug}`} style={{ fontSize: 13, color: N.indigo, textDecoration: 'none', fontWeight: 500 }}>
            Ver caso público →
          </a>
        </div>

        {/* Resolve button */}
        {!resolved && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            style={{
              width: '100%', padding: '16px 24px', borderRadius: 12,
              background: resolving ? N.surface : N.emerald,
              color: resolving ? N.ink3 : N.white,
              border: 'none', cursor: resolving ? 'default' : 'pointer',
              fontSize: 16, fontWeight: 600, fontFamily: N.sans,
              transition: 'background 0.15s',
            }}
          >
            {resolving ? 'A processar...' : `🎉 ${dogLabel} foi encontrado!`}
          </button>
        )}

      </main>
    </div>
  )
}
