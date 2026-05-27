'use client'

import React, { useState } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'

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
    municipality: string
    zone_approx: string
    seen_at: string
    is_public: boolean
    description: string | null
  }>
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

  const dogLabel = c.dog_name ?? 'Cão sem nome'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

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

        {/* Sightings */}
        {sightings.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 11, fontFamily: N.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: N.ink3 }}>
              Avistamentos ({sightings.length})
            </h2>
            <div style={{ border: `1px solid ${N.rule}`, borderRadius: 12, overflow: 'hidden' }}>
              {sightings.map((s, i) => (
                <div key={i} style={{
                  padding: '10px 16px',
                  borderBottom: i < sightings.length - 1 ? `1px solid ${N.ruleSoft}` : 'none',
                  background: N.white,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13.5, color: N.ink, fontWeight: 500 }}>{s.zone_approx}, {s.municipality}</span>
                    <span style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono }}>{hoursAgo(s.seen_at)}</span>
                  </div>
                  {s.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: N.ink3, lineHeight: 1.5 }}>{s.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {sightings.length === 0 && events.length === 0 && !assessment && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: N.ink3, fontSize: 14, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, marginBottom: 28 }}>
            O investigador está a analisar o caso. Volte em breve.
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
