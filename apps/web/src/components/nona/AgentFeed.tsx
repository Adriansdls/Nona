'use client'
import React, { useMemo, useState, useEffect } from 'react'
import { N } from './tokens'
import { Icon } from './Icon'
import { Pill } from './Pill'

export interface AgentEvent {
  t: string
  kind: 'tool' | 'think' | 'share' | 'visit' | 'sighting' | 'resolve' | 'error'
  label: string
  code?: string
  result?: string
  detail?: string
  status?: 'live' | 'ok'
  fresh?: boolean
}

interface KindMeta {
  bg: string
  fg: string
  glyph: string
}

const KIND_META: Record<string, KindMeta> = {
  tool:    { bg: N.indigoBg,  fg: N.indigo,  glyph: '⌘' },
  think:   { bg: N.surface,   fg: N.ink3,    glyph: '…' },
  share:   { bg: N.surface,   fg: N.ink2,    glyph: '↗' },
  visit:   { bg: N.surface,   fg: N.ink2,    glyph: '○' },
  sighting:{ bg: N.amberBg,   fg: N.amber,   glyph: '◆' },
  resolve: { bg: N.emeraldBg, fg: N.emerald, glyph: '✓' },
  error:   { bg: N.roseBg,    fg: N.rose,    glyph: '!' },
}

interface EventRowProps {
  ev: AgentEvent
  fresh?: boolean | undefined
  animate?: boolean
  delay?: number
}

function EventRow({ ev, fresh = false, animate = false, delay = 0 }: EventRowProps) {
  const [shown, setShown] = useState(!animate)
  useEffect(() => {
    if (!animate) return
    const id = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(id)
  }, [animate, delay])

  const meta = KIND_META[ev.kind] ?? { bg: N.surface, fg: N.ink2, glyph: '·' }
  const isLive = ev.status === 'live'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 12,
      padding: '10px 0', borderBottom: `1px solid ${N.ruleSoft}`,
      alignItems: 'flex-start',
      opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(3px)',
      transition: 'opacity .35s ease, transform .35s ease',
      position: 'relative',
    }}>
      {fresh && (
        <span style={{
          position: 'absolute', left: -16, top: 12, width: 2, height: 12, borderRadius: 1,
          background: N.amber,
        }}/>
      )}
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: meta.bg, color: meta.fg,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: N.mono, fontSize: 11, fontWeight: 600, marginTop: 1,
      }}>
        {isLive ? (
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: meta.fg,
            animation: 'nn-pulse 1.6s ease-in-out infinite',
          }}/>
        ) : meta.glyph}
      </span>
      <span style={{ minWidth: 0 }}>
        {ev.kind === 'tool' && (
          <span style={{ fontSize: 13.5, color: N.ink, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 500 }}>{ev.label}</span>
            {ev.code && (
              <span style={{ marginLeft: 8, fontFamily: N.mono, fontSize: 12, color: N.ink3, background: N.surface, padding: '1px 6px', borderRadius: 4 }}>
                {ev.code}
              </span>
            )}
            {ev.result && (
              <span style={{ display: 'block', marginTop: 4, fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>
                <span style={{ color: N.emerald, marginRight: 6 }}>↳</span>{ev.result}
              </span>
            )}
            {isLive && (
              <span style={{ marginLeft: 8, fontFamily: N.mono, fontSize: 10.5, color: N.amber, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                · streaming
              </span>
            )}
          </span>
        )}
        {ev.kind === 'think' && (
          <span style={{ fontSize: 13, color: N.ink3, fontStyle: 'italic', lineHeight: 1.45 }}>{ev.label}</span>
        )}
        {['share', 'visit', 'sighting', 'resolve'].includes(ev.kind) && (
          <span style={{ fontSize: 13.5, color: N.ink, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 500 }}>{ev.label}</span>
            {ev.detail && (
              <span style={{ marginLeft: 8, fontSize: 12.5, color: N.ink3 }}>{ev.detail}</span>
            )}
          </span>
        )}
      </span>
      <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, whiteSpace: 'nowrap', paddingTop: 3 }}>
        {ev.t}
      </span>
    </div>
  )
}

interface AgentFeedProps {
  events: AgentEvent[]
  title?: string
  subtitle?: string
  animate?: boolean
  dense?: boolean
  footer?: boolean
  style?: React.CSSProperties
}

export function AgentFeed({
  events, title = 'Atividade', subtitle, animate = false, dense = false, footer, style = {},
}: AgentFeedProps) {
  const counts = useMemo(() => ({
    total: events.length,
    live: events.filter(e => e.status === 'live').length,
  }), [events])

  return (
    <section style={{
      background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14,
      overflow: 'hidden', ...style,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: `1px solid ${N.ruleSoft}`, background: N.paper,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 24, height: 24, borderRadius: 6, background: N.ink,
            color: N.paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="activity" size={13} color={N.paper} sw={2}/>
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em' }}>{title}</span>
          {subtitle && <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>· {subtitle}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {counts.live > 0 && <Pill kind="live" size="xs">{counts.live} live</Pill>}
          <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>auto-atualizado</span>
        </div>
      </header>
      <div style={{ padding: dense ? '4px 18px' : '6px 18px 10px' }}>
        {events.map((ev, i) => (
          <EventRow key={i} ev={ev} fresh={ev.fresh} animate={animate} delay={i * 200}/>
        ))}
      </div>
      {footer !== false && (
        <footer style={{
          padding: '10px 18px', borderTop: `1px solid ${N.ruleSoft}`, background: N.paper,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          fontFamily: N.mono, fontSize: 11, color: N.ink3,
        }}>
          <span>{counts.total} ações</span>
          <span style={{ display: 'flex', gap: 14 }}>
            <span>filtros</span>
            <span>exportar</span>
          </span>
        </footer>
      )}
    </section>
  )
}

export const INTAKE_EVENTS: AgentEvent[] = [
  { t: '17:14:02', kind: 'think', label: 'recebi o pedido — cão perdido, 2 fotos' },
  { t: '17:14:03', kind: 'tool', label: 'Identifiquei o cão',
    code: 'vision.identify_breed(img)',
    result: 'labrador · castanho · macho · ~5 anos · confiança 0.94' },
  { t: '17:14:05', kind: 'tool', label: 'Verifiquei contra cães encontrados',
    code: 'pgvector.search(k=20, region=algarve)',
    result: '0 coincidências acima do limiar (0.82)' },
  { t: '17:14:06', kind: 'tool', label: 'Normalizei a localização',
    code: 'geocode.normalize("perto do Lidl, Faro")',
    result: '37.020 N, −7.930 W · raio aproximado 600m' },
  { t: '17:14:07', kind: 'tool', label: 'Criei a página pública',
    code: 'case.create(kind=lost, region=faro)',
    result: 'slug gerado com sucesso' },
  { t: '17:14:09', kind: 'tool', label: 'Gerei o cartaz A4',
    code: 'poster.generate_a4(template=pt-pt)',
    result: 'poster.pdf · QR incluído' },
  { t: '17:14:13', kind: 'tool', label: 'Notifiquei voluntários da zona',
    code: 'volunteers.notify(radius=8km)',
    result: '3 voluntários ativos · push enviado' },
  { t: '17:14:14', kind: 'tool', label: 'Canal de avistamentos aberto',
    code: 'sightings.open_channel()', status: 'live' },
]

export const LIFETIME_EVENTS: AgentEvent[] = [
  { t: 'há 12s',    kind: 'sighting', label: 'Novo avistamento',
    detail: 'zona da Estação · Faro · a rever', fresh: true },
  { t: 'há 2 min',  kind: 'share',    label: '+3 partilhas no Facebook',
    detail: 'grupos do Algarve' },
  { t: 'há 4 min',  kind: 'tool',     label: 'Nova verificação visual',
    code: 'vision.recheck()',
    result: '2 candidatos parciais — abaixo do limiar' },
  { t: 'há 6 min',  kind: 'visit',    label: '+18 visitas',
    detail: 'maioria via WhatsApp · cartaz QR' },
  { t: 'há 14 min', kind: 'tool',     label: 'Voluntário a caminho',
    code: 'volunteers.dispatch()',
    result: 'a chegar à zona em ~8 min' },
  { t: 'há 22 min', kind: 'sighting', label: 'Avistamento confirmado',
    detail: 'parque do Lidl · credibilidade alta' },
  { t: 'há 1h 38',  kind: 'tool',     label: 'Caso criado',
    code: 'case.create()', result: 'caso aberto' },
]
