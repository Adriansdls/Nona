'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { Icon } from '@/components/nona/Icon'
import { PhotoPlaceholder } from '@/components/nona/PhotoPlaceholder'
import { Pill } from '@/components/nona/Pill'
import { AgentFeed, type AgentEvent } from '@/components/nona/AgentFeed'
import { buildStepSequence } from '@/lib/guided/sequencer'

const TELEGRAM_BOT = process.env['NEXT_PUBLIC_TELEGRAM_BOT'] ?? 'salvacao_bot'

type Mode = 'lost' | 'found'
type Phase = 0 | 1 | 2 | 3 | 4

interface ProbabilityScenario {
  title: string
  probability: number
  reasoning?: string
  actions: string[]
}

interface ActionGate {
  broadcast_sighting_location: 'public' | 'private_coordinator_only' | 'blocked'
  active_search_permitted: boolean
  crowd_response_blocked: boolean
  name_calling_blocked: boolean
  drone_blocked: boolean
  gate_rationale?: string
  protocol_items?: string[]
  prohibitions?: string[]
}

interface FieldGuide {
  bucket: string
  label: string
  isHard: boolean
  do: string[]
  dont: string[]
  hardNote?: string
  source: string
}

interface ChatMessage {
  from: 'user' | 'agent'
  text: string
  time: string
  quickReplies?: string[] | undefined
  scenarios?: ProbabilityScenario[]
  actionGate?: ActionGate
  fieldGuide?: FieldGuide
}
interface ActionItem { label: string; detail?: string; live?: boolean }
interface RecentReunido {
  id: string; slug: string; type: string; status: string; dog_name: string | null; breed: string
  last_seen_municipality: string; resolved_at: string | null
  case_images: Array<{ public_url: string | null; is_primary: boolean }>
}

const TONES = ['cocoa','sand','rose','moss','slate','cream','midnight'] as const

function formatTime() {
  return new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

interface AutoTextareaProps {
  value: string; onChange: (v: string) => void; onSubmit: () => void
  placeholder: string; minHeight: number; fontSize: number; disabled?: boolean
}
function AutoTextarea({ value, onChange, onSubmit, placeholder, minHeight, fontSize, disabled }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.max(minHeight, ref.current.scrollHeight) + 'px'
    }
  }, [value, minHeight])
  return (
    <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit() } }}
      disabled={disabled} placeholder={placeholder}
      style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', minHeight, fontSize, color: N.ink, lineHeight: 1.45, letterSpacing: '-0.005em', fontFamily: N.sans, display: 'block' }}
      rows={1}/>
  )
}

function InlineActionList({ items }: { items: ActionItem[] }) {
  return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: N.ink2, lineHeight: 1.45 }}>
            <span style={{ marginTop: 3, width: 14, height: 14, borderRadius: 4, background: it.live ? N.amberBg : N.emeraldBg, color: it.live ? N.amber : N.emerald, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {it.live
                ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.amber, animation: 'nn-pulse 1.4s ease-in-out infinite' }}/>
                : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={N.emerald} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12.5 9 17.5 20 6.5"/></svg>}
            </span>
            <span><span style={{ color: N.ink, fontWeight: 500 }}>{it.label}</span>{it.detail && <span style={{ color: N.ink3 }}> · {it.detail}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScenarioPanel({ scenarios }: { scenarios: ProbabilityScenario[] }) {
  return (
    <div style={{ marginTop: 14, padding: '16px 18px', background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
      <p style={{ margin: '0 0 14px', fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        cenários por probabilidade
      </p>
      {scenarios.map((s, i) => (
        <div key={i} style={{ marginBottom: i < scenarios.length - 1 ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 100, height: 5, background: N.rule, borderRadius: 3, flexShrink: 0 }}>
              <div style={{ width: `${Math.round(s.probability * 100)}%`, height: '100%', background: s.probability >= 0.5 ? N.ink : s.probability >= 0.25 ? N.ink2 : N.ink3, borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink, fontWeight: 600, minWidth: 28 }}>
              {Math.round(s.probability * 100)}%
            </span>
            <span style={{ fontFamily: N.display, fontSize: 14, letterSpacing: '-0.01em', color: N.ink }}>
              {s.title}
            </span>
          </div>
          {s.reasoning && (
            <p style={{ margin: '0 0 5px', fontSize: 12, color: N.ink3, fontStyle: 'italic', paddingLeft: 114 }}>{s.reasoning}</p>
          )}
          <ul style={{ margin: 0, paddingLeft: 114, listStyle: 'none', display: 'grid', gap: 3 }}>
            {s.actions.map((a, j) => (
              <li key={j} style={{ fontSize: 12.5, color: N.ink2, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ color: N.ink4, fontSize: 10, marginTop: 2, flexShrink: 0 }}>→</span>{a}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function ProtocolCard({ gate }: { gate: ActionGate }) {
  const isHard = gate.crowd_response_blocked || !gate.active_search_permitted
  const borderColor = isHard ? '#DC2626' : '#D97706'
  const bgColor = isHard ? '#FEF2F2' : '#FFFBEB'
  const labelColor = isHard ? '#991B1B' : '#92400E'

  const protocolItems = gate.protocol_items ?? (isHard ? [
    'Estação de alimentação + câmara nas primeiras 2h',
    'Cartazes néon sem coordenadas exactas',
  ] : ['Busca activa nas primeiras 72h', 'Partilha em grupos locais'])

  const prohibitions = gate.prohibitions ?? [
    ...(gate.name_calling_blocked ? ['Não chame o nome do cão'] : []),
    ...(gate.crowd_response_blocked ? ['Sem grupos de busca > 2 pessoas'] : []),
    ...(gate.broadcast_sighting_location !== 'public' ? ['Não partilhar avistamentos publicamente'] : []),
    ...(gate.drone_blocked ? ['Sem drones'] : []),
  ]

  if (!isHard && prohibitions.length === 0) return null

  return (
    <div style={{ marginTop: 12, padding: '14px 16px', background: bgColor, border: `1.5px solid ${borderColor}33`, borderRadius: 12 }}>
      <p style={{ margin: '0 0 10px', fontFamily: N.mono, fontSize: 10, color: labelColor, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
        protocolo activo
      </p>
      <div style={{ display: 'grid', gap: 5 }}>
        {protocolItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#166534' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="4 12.5 9 17.5 20 6.5"/></svg>
            {item}
          </div>
        ))}
        {prohibitions.map((item, i) => (
          <div key={`p-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#991B1B' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// WP15: Time-indexed field guide card — delivered before a case exists.
function FieldGuideCard({ guide }: { guide: FieldGuide }) {
  const accent = guide.isHard ? '#DC2626' : '#0F766E'
  const bg = guide.isHard ? '#FEF2F2' : '#F0FDFA'
  return (
    <div style={{ marginTop: 12, padding: '14px 16px', background: bg, border: `1.5px solid ${accent}33`, borderRadius: 12 }}>
      <p style={{ margin: '0 0 10px', fontFamily: N.mono, fontSize: 10, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
        protocolo · {guide.label}
      </p>
      {guide.hardNote && (
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#991B1B', fontWeight: 500 }}>🔴 {guide.hardNote}</p>
      )}
      <div style={{ display: 'grid', gap: 5 }}>
        {guide.do.map((item, i) => (
          <div key={`d-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#166534' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="4 12.5 9 17.5 20 6.5"/></svg>
            {item}
          </div>
        ))}
        {guide.dont.map((item, i) => (
          <div key={`x-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#991B1B' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {item}
          </div>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', fontFamily: N.mono, fontSize: 9.5, color: N.ink4, letterSpacing: '0.04em' }}>{guide.source}</p>
    </div>
  )
}

// ── Protocol widget: breed + trigger → real protocol card, no signup ────────
type BreedKey = 'galgo' | 'podenco' | 'labrador' | 'outro'
type TriggerKey = 'susto' | 'porta' | 'perseguiu'

// Pure client-side protocol compute — mirrors route.ts computePhaseAndGate.
function computeWidgetProtocol(breed: BreedKey, trigger: TriggerKey): {
  isHard: boolean; dos: string[]; donts: string[]; source: string
} {
  const isHard = breed === 'galgo' || breed === 'podenco' || trigger === 'susto'
  if (isHard) {
    return {
      isHard: true,
      dos: [
        'Estação de alimentação no ponto exacto — comida + água',
        'Peça de roupa com o teu cheiro (sem perfume)',
        'Câmara de movimento a vigiar a estação',
        'Notifica canil municipal e 3 veterinários próximos',
        'Cartaz simples nas 10 lojas/paragens mais próximas',
      ],
      donts: [
        'Não corras atrás — desloca o cão para mais longe',
        'Não chames o nome — em stress, condiciona a fuga',
        'Sem batidas de busca em grupo — assusta o cão',
        'Não partilhes a localização exacta publicamente',
      ],
      source: 'Weiss 2012 (n=1.015) · Albrecht/MAR 2018 IAABC',
    }
  }
  return {
    isHard: false,
    dos: [
      'Busca activa nas primeiras 72h é segura',
      'Cartazes nas 10 lojas/paragens mais próximas',
      'Avisa canil municipal + 3 clínicas veterinárias',
      'Publica no grupo local com o cruzamento mais próximo (sem GPS)',
      'Estação de alimentação no ponto de desaparecimento',
    ],
    donts: [
      'Não busques longe de carro nas primeiras horas — está perto',
      'Grupos de busca > 2 pessoas são contraproducentes',
    ],
    source: 'Weiss 2012 (n=1.015) · Lord 2007 JAVMA',
  }
}

function computeWidgetProtocolEN(breed: BreedKey, trigger: TriggerKey): {
  isHard: boolean; dos: string[]; donts: string[]; source: string
} {
  const base = computeWidgetProtocol(breed, trigger)
  if (base.isHard) {
    return {
      isHard: true,
      dos: [
        'Feeding station at the exact disappearance point — food + water',
        'Item of clothing with your scent (no perfume)',
        'Motion camera watching the station',
        'Notify the nearest municipal shelter and 3 vet clinics',
        'Simple poster in the 10 closest shops/bus stops',
      ],
      donts: [
        "Don't run after the dog — it displaces them further",
        "Don't call their name — under stress it triggers flight",
        'No search parties — groups frighten a scared dog',
        "Don't share the exact location publicly",
      ],
      source: 'Weiss 2012 (n=1,015) · Albrecht/MAR 2018 IAABC',
    }
  }
  return {
    isHard: false,
    dos: [
      'Active search safe in the first 72h',
      'Posters in the 10 closest shops/bus stops',
      'Notify the nearest shelter + 3 vet clinics',
      'Post in local Facebook group with nearest junction (no GPS)',
      'Feeding station at the disappearance point',
    ],
    donts: [
      "Don't search far by car in the first hours — they're nearby",
      'Search parties larger than 2 people are counterproductive',
    ],
    source: 'Weiss 2012 (n=1,015) · Lord 2007 JAVMA',
  }
}

function ProtocolWidget({ locale, onStart }: { locale: string; onStart: (msg: string) => void }) {
  const [breed, setBreed] = React.useState<BreedKey | null>(null)
  const [trigger, setTrigger] = React.useState<TriggerKey | null>(null)
  const en = locale === 'en'

  const protocol = breed && trigger
    ? (en ? computeWidgetProtocolEN(breed, trigger) : computeWidgetProtocol(breed, trigger))
    : null

  const breedOpts: Array<{ id: BreedKey; pt: string; en: string }> = [
    { id: 'galgo', pt: 'Galgo', en: 'Greyhound' },
    { id: 'podenco', pt: 'Podenco', en: 'Podenco' },
    { id: 'labrador', pt: 'Labrador / sociável', en: 'Labrador / sociable' },
    { id: 'outro', pt: 'Outro', en: 'Other breed' },
  ]
  const triggerOpts: Array<{ id: TriggerKey; pt: string; en: string }> = [
    { id: 'susto', pt: 'Assustou-se com barulho', en: 'Scared by a noise' },
    { id: 'porta', pt: 'Saiu por porta/portão', en: 'Slipped through a door/gate' },
    { id: 'perseguiu', pt: 'Perseguiu um animal', en: 'Chased an animal' },
  ]

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 8, border: `1px solid ${active ? N.ink : N.rule}`,
    background: active ? N.ink : N.white, color: active ? N.paper : N.ink2,
    fontSize: 13, fontWeight: 500, fontFamily: N.sans, cursor: 'pointer',
    transition: 'all .12s ease',
  })

  return (
    <section style={{ padding: '64px 32px 0', borderTop: `1px solid ${N.rule}`, marginTop: 56 }}>
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <p style={{ margin: '0 0 6px', fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {en ? 'your protocol · no signup' : 'o teu protocolo · sem registo'}
      </p>
      <h2 style={{ margin: '0 0 6px', fontFamily: N.display, fontWeight: 400, fontSize: 38, letterSpacing: '-0.02em', color: N.ink } as React.CSSProperties}>
        {en ? 'See the correct first steps. Now.' : 'Vê os primeiros passos certos. Agora.'}
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 15, color: N.ink3, lineHeight: 1.55 }}>
        {en
          ? 'Two questions. Your protocol — including what never to do — in 10 seconds.'
          : 'Duas perguntas. O teu protocolo — incluindo o que nunca fazer — em 10 segundos.'}
      </p>

      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: N.ink, fontFamily: N.sans }}>
          {en ? '1. Your dog is…' : '1. O teu cão é…'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {breedOpts.map(b => (
            <button key={b.id} onClick={() => setBreed(b.id)} style={chipStyle(breed === b.id)}>
              {en ? b.en : b.pt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: N.ink, fontFamily: N.sans }}>
          {en ? '2. How did they get lost?' : '2. Como se perdeu?'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {triggerOpts.map(t => (
            <button key={t.id} onClick={() => setTrigger(t.id)} style={chipStyle(trigger === t.id)}>
              {en ? t.en : t.pt}
            </button>
          ))}
        </div>
      </div>

      {protocol && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ padding: '20px 22px', background: protocol.isHard ? '#FEF2F2' : '#F0FDFA', border: `1.5px solid ${protocol.isHard ? '#DC262633' : '#0F766E33'}`, borderRadius: 14 }}>
            {protocol.isHard && (
              <p style={{ margin: '0 0 12px', fontFamily: N.mono, fontSize: 10.5, color: '#991B1B', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                {en ? '🔴 Passive profile — active search will push the dog further' : '🔴 Perfil passivo — busca activa afasta o cão'}
              </p>
            )}
            <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              {protocol.dos.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#166534' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="4 12.5 9 17.5 20 6.5"/></svg>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 5 }}>
              {protocol.donts.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#991B1B' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  {item}
                </div>
              ))}
            </div>
            <p style={{ margin: '14px 0 0', fontFamily: N.mono, fontSize: 9.5, color: N.ink4 }}>{protocol.source}</p>
          </div>
          <button
            onClick={() => onStart(en
              ? "I need help. I just lost my dog. Guide me through the correct protocol right now."
              : 'Preciso de ajuda. Acabei de perder o meu cão. Guia-me pelo protocolo correcto agora.')}
            style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 10, border: 'none', background: N.ink, color: N.paper, fontSize: 14, fontWeight: 600, fontFamily: N.sans, cursor: 'pointer' }}
          >
            {en ? 'This is my case — start →' : 'Este é o meu caso — começar →'}
          </button>
        </div>
      )}
    </div>
    </section>
  )
}

// ── "O que NÃO fazer" — high-contrast band ──────────────────────────────────
function DontSection({ locale }: { locale: string }) {
  const en = locale === 'en'
  const rows = en ? [
    { want: "Run after them", but: "It displaces a panicked dog further away", do: "Stay still. Leave scent and food." },
    { want: "Shout their name", but: "Under stress, the name reinforces flight", do: "Silence. Let them come to you." },
    { want: "20-person search party", but: "A crowd terrifies a lost dog", do: "Max 2 people — or just a camera." },
    { want: "Drive around searching far", but: "In the first hours they're close, hiding", do: "Walk nearby, on foot. Look for water." },
  ] : [
    { want: 'Correr atrás', but: 'Desloca um cão assustado para mais longe', do: 'Fica parado. Deixa cheiro e comida.' },
    { want: 'Gritar o nome', but: 'Em stress, o nome reforça a fuga', do: 'Silêncio. Espera que venha ter contigo.' },
    { want: 'Batida de 20 pessoas', but: 'Uma multidão aterra um cão perdido', do: 'Máximo 2 pessoas — ou só câmara.' },
    { want: 'Procurar longe, de carro', but: 'Nas primeiras horas está perto, escondido', do: 'Caminha a pé por perto. Procura pontos de água.' },
  ]
  return (
    <section style={{ padding: '64px 32px 0', marginTop: 8 }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <p style={{ margin: '0 0 6px', fontFamily: N.mono, fontSize: 11, color: N.rose, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {en ? 'what not to do' : 'o que não fazer'}
      </p>
      <h2 style={{ margin: '0 0 6px', fontFamily: N.display, fontWeight: 400, fontSize: 38, letterSpacing: '-0.02em', color: N.ink } as React.CSSProperties}>
        {en ? 'Instinct is wrong. Science is not.' : 'O instinto engana. A ciência não.'}
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 15, color: N.ink3 }}>
        {en
          ? 'These are the four things most people do. All four push the dog further away.'
          : 'São as quatro coisas que toda a gente faz. As quatro afastam o cão.'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ padding: '18px 20px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: N.mono, fontSize: 10, color: N.rose, letterSpacing: '0.1em', textTransform: 'uppercase', paddingTop: 2 }}>
                {en ? 'want to' : 'instinto'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: N.ink }}>{r.want}</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: N.ink2, lineHeight: 1.5 }}>
              <span style={{ color: N.rose, fontWeight: 600 }}>{en ? 'But: ' : 'Mas: '}</span>{r.but}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>{en ? 'Do: ' : 'Faz: '}</span>{r.do}
            </p>
          </div>
        ))}
      </div>
      <p style={{ margin: '18px 0 0', fontFamily: N.mono, fontSize: 11.5, color: N.ink3, fontStyle: 'italic' }}>
        {en
          ? 'This is exactly what I was about to do wrong. It is what most people do. That is why we exist.'
          : 'Foi exactamente o que ia fazer mal. É o que a maioria faz. Por isso existimos.'}
      </p>
    </div>
    </section>
  )
}

// ── 5 Pillars ────────────────────────────────────────────────────────────────
function PillarsSection({ locale }: { locale: string }) {
  const en = locale === 'en'
  const pillars = en ? [
    {
      num: '01',
      title: 'Start in panic, zero friction',
      body: "Talk — don't fill out forms. And if you only want to know what to do right now, we tell you before you give us any details. Free. No account.",
      sub: 'The first step takes seconds.',
    },
    {
      num: '02',
      title: 'Everything possible, done for you',
      body: 'Before you finish talking, the nearest shelters, vet clinics, local groups and the GNR are already notified. Posters generated. Posts ready.',
      sub: 'You coordinate nothing.',
    },
    {
      num: '03',
      title: 'The protocol that works',
      body: "Not tips. A protocol calibrated to your case: breed, how they got lost, terrain, time elapsed. Backed by 1,015 cases (Weiss 2012) and field research.",
      sub: 'Personal visit to the shelter: 2.1× more recovery (Lord 2007).',
    },
    {
      num: '04',
      title: 'We watch. You confirm.',
      body: "We monitor sightings and local groups. When a photo matches, we alert you instantly with the probability — and you say if it's them. Every confirmation tightens the search radius.",
      sub: 'The case stays alive around the clock.',
    },
    {
      num: '05',
      title: "We don't replace your community. We activate it.",
      body: 'Facebook groups, volunteers, neighbours — they are the force. We give them the infrastructure: the structured case, the protocol, the coordination.',
      sub: 'Community finds dogs. We handle the rest.',
    },
  ] : [
    {
      num: '01',
      title: 'Começa em pânico, sem fricção',
      body: 'Falas — não preenches formulários. E se só queres saber o que fazer agora, dizemos-te antes de nos contares fosse o que fosse. Gratuito. Sem conta.',
      sub: 'O primeiro passo demora segundos.',
    },
    {
      num: '02',
      title: 'Tudo o que é possível, feito por ti',
      body: 'Antes de acabares de falar, os canis, veterinários, grupos da zona e a GNR já estão avisados. Cartazes gerados. Partilhas prontas.',
      sub: 'Não coordenas nada.',
    },
    {
      num: '03',
      title: 'O protocolo que funciona',
      body: 'Não são "dicas". É protocolo, calibrado ao teu caso: raça, como se perdeu, terreno, tempo decorrido. Baseado em 1.015 casos (Weiss 2012) e investigação de campo.',
      sub: 'Visita presencial ao canil: 2,1× mais recuperação (Lord 2007).',
    },
    {
      num: '04',
      title: 'Vigiamos. Tu confirmas.',
      body: 'Vigiamos avistamentos e grupos da zona. Quando uma foto encaixa, avisamos ao instante com a probabilidade — e tu dizes se é ele. Cada confirmação estreita o raio de busca.',
      sub: 'O caso mantém-se vivo 24/7.',
    },
    {
      num: '05',
      title: 'Não substituímos a tua comunidade. Activamo-la.',
      body: 'Grupos de Facebook, voluntários, vizinhos — são a força. Nós damos-lhes a infraestrutura: o caso estruturado, o protocolo, a coordenação.',
      sub: 'A comunidade encontra cães. Nós tratamos do resto.',
    },
  ]
  return (
    <section id="como" style={{ padding: '64px 32px 0', borderTop: `1px solid ${N.rule}`, marginTop: 56 }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <p style={{ margin: '0 0 6px', fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {en ? 'how it works' : 'como funciona'}
      </p>
      <h2 style={{ margin: '0 0 36px', fontFamily: N.display, fontWeight: 400, fontSize: 38, letterSpacing: '-0.02em', color: N.ink } as React.CSSProperties}>
        {en
          ? <>Five layers.<br/><span style={{ fontStyle: 'italic' }}>One objective.</span></>
          : <>Cinco camadas.<br/><span style={{ fontStyle: 'italic' }}>Um objectivo.</span></>
        }
      </h2>
      <div style={{ display: 'grid', gap: 2 }}>
        {pillars.map((p) => (
          <div key={p.num} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20, padding: '20px 0', borderTop: `1px solid ${N.ruleSoft}` }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink4, paddingTop: 4, letterSpacing: '0.04em' }}>{p.num}</span>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: N.ink, letterSpacing: '-0.01em', fontFamily: N.sans }}>{p.title}</p>
              <p style={{ margin: '0 0 5px', fontSize: 14, color: N.ink2, lineHeight: 1.6 }}>{p.body}</p>
              <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>{p.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </section>
  )
}

interface HomePageClientProps {
  locale: string; reunidosCount: number; recentReunidos: RecentReunido[]
}

// Card dimensions for the canvas before expansion (matches hero input card position)
interface CardRect { left: number; top: number; width: number; height: number }

const _AGENT_NAMES = ["Beatriz","Rui","Margarida","Tiago","Catarina","João","Sofia","Marta","Pedro","Inês","Gonçalo","Carolina","Diogo","Rita","André","Matilde","Nuno","Raquel","Miguel","Lara"]

export function HomePageClient({ locale, reunidosCount, recentReunidos }: HomePageClientProps) {
  const [agentName] = useState(() => _AGENT_NAMES[Math.floor(Math.random() * _AGENT_NAMES.length)]!)
  const [candidates] = useState<string[]>(() => {
    const pool = _AGENT_NAMES.filter(n => n !== agentName).sort(() => Math.random() - 0.5).slice(0, 3)
    return [...pool, agentName]
  })
  const [assigning, setAssigning] = useState(false)
  const [assignStep, setAssignStep] = useState(0)
  const [activeAgentsCount] = useState(() => Math.floor(Math.random() * 8) + 8)
  const [mode, setMode] = useState<Mode>('lost')
  const [phase, setPhase] = useState<Phase>(0)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [nonaText, setNonaText] = useState('')
  const [nonaActions, setNonaActions] = useState<ActionItem[]>([])
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [caseSlug, setCaseSlug] = useState<string | null>(null)
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [proAlert, setProAlert] = useState<{ canils: number; vets: number } | null>(null)
  const [caseActionGate, setCaseActionGate] = useState<ActionGate | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [probabilityScenarios, setProbabilityScenarios] = useState<ProbabilityScenario[]>([])
  const chatRef = useRef<HTMLDivElement>(null)

  // Voice + image input (web parity with the Telegram bot)
  const [stagedPhoto, setStagedPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handlePhotoPick = useCallback(async (file: File) => {
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await fetch('/api/intake/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { path } = await res.json() as { path: string }
        setStagedPhoto({ path, preview: URL.createObjectURL(file) })
      }
    } finally {
      setUploadingPhoto(false)
    }
  }, [])

  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      audioChunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecording(false)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size === 0) return
        setTranscribing(true)
        try {
          const fd = new FormData()
          fd.append('audio', blob, 'voice.webm')
          fd.append('locale', locale)
          const res = await fetch('/api/intake/transcribe', { method: 'POST', body: fd })
          if (res.ok) {
            const { text } = await res.json() as { text: string }
            if (text) setInputValue(prev => (prev ? `${prev} ${text}` : text))
          }
        } finally {
          setTranscribing(false)
        }
      }
      mediaRecorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      // mic denied / unavailable — silently no-op (user can type)
    }
  }, [recording, locale])

  // Measure the hero input card to use as the canvas expansion origin
  const heroInputRef = useRef<HTMLDivElement>(null)
  const [cardRect, setCardRect] = useState<CardRect | null>(null)
  const [viewport, setViewport] = useState({ w: 1440, h: 900 })

  useEffect(() => {
    const measure = () => {
      if (heroInputRef.current) {
        const r = heroInputRef.current.getBoundingClientRect()
        setCardRect({ left: r.left, top: r.top, width: r.width, height: r.height })
      }
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (!assigning) { setAssignStep(0); return }
    const timers = candidates.map((_, i) =>
      setTimeout(() => setAssignStep(i + 1), 250 + i * 380)
    )
    return () => timers.forEach(t => clearTimeout(t))
  }, [assigning, candidates])

  const scrollChat = useCallback(() => {
    requestAnimationFrame(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight })
  }, [])

  const handleSubmit = useCallback(async (overrideText?: string) => {
    let text = (typeof overrideText === 'string' ? overrideText : inputValue).trim()
    // Photo-only submit: send a default message so the agent knows a photo arrived.
    if (!text && stagedPhoto) text = locale === 'en' ? 'Here is a photo of the dog.' : 'Aqui está uma foto do cão.'
    if (!text) return

    const userMsg: ChatMessage = { from: 'user', text, time: formatTime() }
    // Append, never replace — preserves full conversation history in UI
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    scrollChat()
    if (messages.length === 0) {
      setAssigning(true)
      setTimeout(() => {
        setAssigning(false)
        setPhase(2)
        setTimeout(() => setPhase(3), 400)
      }, 1900)
    } else {
      setPhase(2)
      setTimeout(() => setPhase(3), 400)
    }

    setStreaming(true)
    let accumulated = ''
    let gotDone = false
    let scenariosSnap: ProbabilityScenario[] = []
    let actionGateSnap: ActionGate | undefined = undefined
    let fieldGuideSnap: FieldGuide | undefined = undefined
    const events: AgentEvent[] = []
    const actions: ActionItem[] = []

    try {
      // Pass existing messages as history so Claude maintains context across turns
      const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const photoPath = stagedPhoto?.path ?? null
      const res = await fetch('/api/intake/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode, history, agentName, stagedPhotoPath: photoPath }),
      })
      setStagedPhoto(null)  // consumed — attaches to the case create_case fires this turn
      if (!res.ok || !res.body) throw new Error('stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      setPhase(4)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6)) as Record<string, unknown>
            if (evt['type'] === 'text_delta') {
              accumulated += String(evt['delta'] ?? '')
              setNonaText(accumulated); scrollChat()
            } else if (evt['type'] === 'tool_start') {
              const label = TOOL_LABELS[String(evt['tool'] ?? '')] ?? String(evt['tool'] ?? '')
              events.push({ t: formatTime(), kind: 'tool', label })
              setAgentEvents([...events])
            } else if (evt['type'] === 'tool_result') {
              const last = events[events.length - 1]
              if (last) {
                last.code = String(evt['code'] ?? ''); last.result = String(evt['result'] ?? '')
                if (evt['status'] === 'live') last.status = 'live'
                actions.push({ label: last.label, detail: String(evt['result'] ?? ''), live: evt['status'] === 'live' })
              }
              setAgentEvents([...events]); setNonaActions([...actions])
            } else if (evt['type'] === 'probability_scenarios') {
              scenariosSnap = Array.isArray(evt['scenarios']) ? evt['scenarios'] as ProbabilityScenario[] : []
              setProbabilityScenarios(scenariosSnap)
            } else if (evt['type'] === 'action_gate' || evt['type'] === 'action_gate_card') {
              const gateData = evt['type'] === 'action_gate' ? evt['gate'] : evt['card']
              if (gateData && typeof gateData === 'object') {
                actionGateSnap = gateData as ActionGate
                setCaseActionGate(gateData as ActionGate)
              }
            } else if (evt['type'] === 'field_guide') {
              const g = evt['guide']
              if (g && typeof g === 'object') fieldGuideSnap = g as FieldGuide
            } else if (evt['type'] === 'professional_alert') {
              const a = evt['alert'] as { canils?: number; vets?: number } | undefined
              const canils = a?.canils ?? 0
              const vets = a?.vets ?? 0
              const pending = canils < 0 || vets < 0
              setProAlert({ canils, vets })
              events.push({
                t: formatTime(), kind: 'tool', status: 'live',
                label: 'Rede profissional avisada',
                result: pending
                  ? 'canis e veterinários da zona a ser contactados'
                  : `${canils} ${canils === 1 ? 'canil' : 'canis'} · ${vets} ${vets === 1 ? 'veterinário' : 'veterinários'}`,
              })
              setAgentEvents([...events])
            } else if (evt['type'] === 'case_created') {
              setCaseSlug(String(evt['slug'] ?? ''))
              if (evt['ownerToken']) setOwnerToken(String(evt['ownerToken']))
            } else if (evt['type'] === 'quick_replies') {
              setQuickReplies(Array.isArray(evt['replies']) ? evt['replies'] as string[] : [])
            } else if (evt['type'] === 'done') {
              gotDone = true
              const qr = Array.isArray(evt['quick_replies']) ? evt['quick_replies'] as string[] : []
              setMessages(prev => [...prev, { from: 'agent' as const, text: accumulated, time: formatTime(), ...(qr.length > 0 ? { quickReplies: qr } : {}), ...(scenariosSnap.length > 0 ? { scenarios: scenariosSnap } : {}), ...(actionGateSnap ? { actionGate: actionGateSnap } : {}), ...(fieldGuideSnap ? { fieldGuide: fieldGuideSnap } : {}) }])
              setProbabilityScenarios([])
              setNonaText(''); setNonaActions([])
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('intake stream error', err)
    } finally {
      // Always leave the "a processar" state, even if the fetch threw before
      // setPhase(4) ran or the stream ended without a 'done' event — otherwise
      // the thinking indicator hangs forever.
      setPhase(4)
      if (!accumulated && !gotDone) {
        setMessages(prev => [...prev, { from: 'agent' as const, text: 'Algo correu mal a contactar a Nona. Tenta enviar de novo.', time: formatTime() }])
      }
      setNonaText(''); setNonaActions([])
      setStreaming(false); scrollChat()
    }
  }, [inputValue, mode, messages, scrollChat, stagedPhoto, locale, agentName])

  const inChat = phase >= 1
  const panelIn = phase >= 4

  return (
    <div className="nn" style={{ position: 'fixed', inset: 0, background: N.paper, overflow: 'hidden' }}>

      {/* Always-mounted hidden file input — shared by hero + chat composer */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) void handlePhotoPick(f); e.target.value = '' }}/>

      {/* ══ CHROME — home nav, hero, reunidos, footer ══ */}
      {/* Chrome includes the "real" hero input the user types into.           */}
      {/* When phase≥1 it fades away while the canvas expands over it.         */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: phase === 0 ? 1 : 0, transition: 'opacity .45s ease', pointerEvents: phase === 0 ? 'auto' : 'none', overflowY: 'auto' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: N.paper, borderBottom: `1px solid ${N.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Logo size={18}/>
            <nav style={{ display: 'flex', gap: 22 }}>
              {(locale === 'en'
                ? [{ label: 'Cases', href: `/${locale}/casos` }, { label: 'How it works', href: '#como' }, { label: 'I saw a dog', href: `/${locale}/vi-um-cao` }]
                : [{ label: 'Casos', href: `/${locale}/casos` }, { label: 'Como funciona', href: '#como' }, { label: 'Vi um cão', href: `/${locale}/vi-um-cao` }]
              ).map(item => (
                <a key={item.label} href={item.href} style={{ fontSize: 13, color: N.ink3, textDecoration: 'none', fontWeight: 500, fontFamily: N.sans }}>{item.label}</a>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>
              </span>
              agente online
            </span>
            <span style={{ color: N.ink4 }}>·</span>
            <span>{locale}</span>
          </div>
        </header>

        {/* ══ HERO ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6vh 32px 0' }}>
        <div style={{ width: 720, maxWidth: '90vw' }}>

          <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {locale === 'en' ? 'lost dog investigator · algarve' : 'investigador para cães perdidos · algarve'}
          </p>

          <h1 style={{ margin: '16px 0 0', fontFamily: N.display, fontWeight: 400, fontSize: 72, letterSpacing: '-0.025em', lineHeight: 0.97, color: N.ink } as React.CSSProperties}>
            {locale === 'en'
              ? <>There is a protocol.<br/><span style={{ fontStyle: 'italic' }}>It works. We run it.</span></>
              : <>Há um protocolo.<br/><span style={{ fontStyle: 'italic' }}>Funciona. Nós tratamos dele.</span></>
            }
          </h1>

          <p style={{ margin: '22px auto 0', maxWidth: 500, fontSize: 15.5, color: N.ink2, lineHeight: 1.6 }}>
            {locale === 'en'
              ? 'Every hour counts — but panic loses dogs. Tell us what happened and we run the plan the science says to follow.'
              : 'Cada hora conta — mas o pânico perde cães. Diz-nos o que aconteceu e executamos o plano que a ciência diz para seguir.'
            }
          </p>

          {/* Confidence band */}
          <p style={{ margin: '16px auto 0', maxWidth: 460, fontFamily: N.mono, fontSize: 11.5, color: N.ink3, lineHeight: 1.55, letterSpacing: '0.01em' }}>
            {locale === 'en'
              ? 'When you finish talking to us, you will have done everything the science says to do in the first hour.'
              : 'Quando acabas de falar connosco, já fizeste tudo o que a ciência manda fazer na primeira hora.'
            }
          </p>

          {/* Live counter */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>
            </span>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
              {activeAgentsCount} {locale === 'en' ? 'cases in active monitoring · free · no account needed' : 'casos em monitorização activa · gratuito · sem conta para começar'}
            </span>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'inline-flex', marginTop: 20, padding: 3, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 999, gap: 2 }}>
            {([
              { id: 'lost' as Mode, label: locale === 'en' ? 'I lost a dog' : 'perdi um cão', accent: N.rose },
              { id: 'found' as Mode, label: locale === 'en' ? 'I found a dog' : 'encontrei um cão', accent: N.emerald },
            ]).map(o => (
              <button key={o.id} onClick={() => setMode(o.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, border: 'none', background: mode === o.id ? N.ink : 'transparent', color: mode === o.id ? N.paper : N.ink2, fontSize: 13, fontWeight: 500, transition: 'all .15s ease', cursor: 'pointer', fontFamily: N.sans }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.accent }}/>{o.label}
              </button>
            ))}
          </div>

          {/* Hero input card — measured to anchor canvas expansion */}
          <div ref={heroInputRef} style={{ marginTop: 14, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 18, padding: '20px 22px 14px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 14px 36px -10px rgba(11,12,16,.10)', textAlign: 'left' }}>
            <AutoTextarea value={inputValue} onChange={setInputValue} onSubmit={handleSubmit}
              placeholder={mode === 'lost'
                ? (locale === 'en' ? 'Describe your dog and where you lost him...' : 'Descreve o teu cão e onde o perdeste...')
                : (locale === 'en' ? 'Describe the dog you found and where...' : 'Descreve o cão que encontraste e onde...')}
              minHeight={56} fontSize={18}/>
            {(stagedPhoto || uploadingPhoto) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                {stagedPhoto && <img src={stagedPhoto.preview} alt="" style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover' }}/>}
                <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>{uploadingPhoto ? 'a carregar foto…' : (locale === 'en' ? 'photo attached' : 'foto anexada')}</span>
                {stagedPhoto && <button onClick={() => setStagedPhoto(null)} style={{ border: 'none', background: 'transparent', color: N.ink4, cursor: 'pointer', fontSize: 12 }}>{locale === 'en' ? 'remove' : 'remover'}</button>}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${N.ruleSoft}` }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => fileInputRef.current?.click()} title={locale === 'en' ? 'Attach photo' : 'Anexar foto'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, fontSize: 12.5, cursor: 'pointer', fontFamily: N.sans }}>
                  <Icon name="photo" size={14} color={N.ink3}/>{locale === 'en' ? 'photo' : 'foto'}
                </button>
                <button onClick={toggleRecording} title={recording ? (locale === 'en' ? 'Stop' : 'Parar') : (locale === 'en' ? 'Record voice' : 'Gravar voz')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7, border: 'none', background: recording ? N.roseBg : 'transparent', color: recording ? N.rose : N.ink3, fontSize: 12.5, cursor: 'pointer', fontFamily: N.sans }}>
                  <Icon name="mic" size={14} color={recording ? N.rose : N.ink3}/>{transcribing ? (locale === 'en' ? 'transcribing…' : 'a transcrever…') : (locale === 'en' ? 'voice' : 'voz')}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
                <span>pt · en · es</span>
                <button onClick={() => handleSubmit()} disabled={!inputValue.trim() && !stagedPhoto} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: 'none', background: (inputValue.trim() || stagedPhoto) ? N.ink : N.rule, color: (inputValue.trim() || stagedPhoto) ? N.paper : N.ink4, fontSize: 13, fontWeight: 500, fontFamily: N.sans, cursor: (inputValue.trim() || stagedPhoto) ? 'pointer' : 'default', transition: 'all .15s ease' }}>
                  {locale === 'en' ? 'start' : 'começar'} <Icon name="enter" size={12} color={(inputValue.trim() || stagedPhoto) ? N.paper : N.ink4}/>
                </button>
              </div>
            </div>
          </div>

          {/* WP15: guidance-first CTA */}
          {mode === 'lost' && (
            <button
              onClick={() => handleSubmit(locale === 'en'
                ? "I just lost my dog right now. Tell me exactly what to do IMMEDIATELY, step by step, before I give you all the details."
                : 'Acabei de perder o meu cão agora mesmo. Diz-me exatamente o que fazer JÁ, passo a passo, antes de te dar todos os detalhes.')}
              style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999, border: `1px solid ${N.rule}`, background: N.white, color: N.ink, fontSize: 13, fontWeight: 500, fontFamily: N.sans, cursor: 'pointer', transition: 'border-color .15s' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.rose, flexShrink: 0 }}/>
              {locale === 'en' ? "I'm in the field — tell me what to do now" : 'Estou no terreno — diz-me o que fazer já'}
            </button>
          )}

          <p style={{ margin: '10px 0 0', fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>
            {locale === 'en' ? <>or <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>cmd ↵</span> · voice? <a href={`https://t.me/${TELEGRAM_BOT}`} style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>telegram</a></> : <>ou <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>cmd ↵</span> · prefere voz? <a href={`https://t.me/${TELEGRAM_BOT}`} style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>telegram</a></>}
          </p>

        </div>{/* end 720 */}
        </div>{/* end hero center */}

        {/* ══ WIDGET: ver protocolo agora, sem registo ══ */}
        <ProtocolWidget locale={locale} onStart={(msg) => handleSubmit(msg)}/>

        {/* ══ O QUE NÃO FAZER ══ */}
        <DontSection locale={locale}/>

        {/* ══ 5 PILARES ══ */}
        <PillarsSection locale={locale}/>

        {/* ══ REUNIDOS ══ */}
        <div style={{ padding: '56px 32px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {locale === 'en' ? `reunited with family · ${reunidosCount}` : `reunidos com família · ${reunidosCount}`}
            </span>
            <a href={`/${locale}/casos`} style={{ fontSize: 12, color: N.ink2, textDecoration: 'none' }}>
              {locale === 'en' ? 'see all →' : 'ver todos →'}
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {(recentReunidos.length > 0 ? recentReunidos : Array.from({ length: 7 })).map((d, i) => {
              const c = d as RecentReunido | undefined
              const tone = TONES[i % TONES.length] ?? 'cocoa'
              const img = c?.case_images?.find(x => x.is_primary) ?? c?.case_images?.[0]
              const isReunido = c?.status === 'reunido'
              const dotColor = isReunido ? N.emerald : c?.type === 'perdido' ? N.rose : N.amber
              return (
                <a key={i} href={c ? `/${locale}/caso/${c.slug}` : undefined}
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, textDecoration: 'none', color: 'inherit', cursor: c ? 'pointer' : 'default' }}>
                  <div style={{ position: 'relative' }}>
                    {img?.public_url
                      ? <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1' }}><img src={img.public_url} alt={c?.dog_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/></div>
                      : <PhotoPlaceholder tone={tone} radius={10} ratio="1/1"/>}
                    {c && <span style={{ position: 'absolute', top: 7, left: 7, width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: '0 0 0 2px rgba(255,255,255,.8)' }}/>}
                  </div>
                  {c && (
                    <div style={{ paddingBottom: 2 }}>
                      <div style={{ fontFamily: N.display, fontSize: 14, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.dog_name ?? c.breed}</div>
                      <div style={{ fontSize: 10.5, color: N.ink3, fontFamily: N.mono }}>{c.last_seen_municipality}</div>
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        </div>
        </div>

        {/* ══ FOOTER ══ */}
        <footer style={{ marginTop: 56, padding: '16px 32px', borderTop: `1px solid ${N.rule}`, display: 'flex', justifyContent: 'space-between', fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
          <div>
            <span style={{ fontWeight: 600, color: N.ink }}>nona</span>
            {' '}·{' '}
            {locale === 'en'
              ? 'rescue operating system · algarve · free · open-source (MIT)'
              : 'sistema operativo de resgate canino · algarve · gratuito · open-source (MIT)'}
          </div>
          <span style={{ display: 'flex', gap: 18 }}>
            {locale === 'en'
              ? <><span>privacy</span><span>how it works</span><span>community</span></>
              : <><span>privacidade</span><span>como funciona</span><span>comunidade</span></>}
            <a href="/login" style={{ color: N.ink4, textDecoration: 'none' }}>{locale === 'en' ? 'team' : 'equipa'}</a>
          </span>
        </footer>
      </div>

      {/* ══ CHAT CANVAS — only mounts on submit, springs from hero card rect → full viewport ══ */}
      {inChat && (
      <motion.div
        initial={{
          left: cardRect?.left ?? 0,
          top: cardRect?.top ?? 0,
          right: cardRect ? viewport.w - cardRect.left - cardRect.width : 0,
          bottom: cardRect ? viewport.h - cardRect.top - cardRect.height : 0,
          borderRadius: 18,
        }}
        animate={{
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: 0,
          paddingRight: panelIn ? 360 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 28,
          mass: 1,
        }}
        style={{
          position: 'fixed',
          background: N.white,
          zIndex: 15,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 48,
          paddingBottom: 56,
        }}
      >
        {/* Compact nav — absolute inside canvas */}
        <header style={{ position: 'absolute', top: 0, left: 0, right: panelIn ? 360 : 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${N.rule}`, background: N.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Logo size={18}/>
            {caseSlug && (<>
              <span style={{ width: 1, height: 16, background: N.rule }}/>
              <span style={{ fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>caso · <a href={`/${locale}/caso/${caseSlug}`} style={{ color: N.ink, textDecoration: 'none' }}>{caseSlug}</a></span>
              <Pill kind="active" size="xs"/>
            </>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
            <Icon name="sparkle" size={11} color={N.indigo}/>
            <span>nona · investigador IA</span>
            {streaming && <><span style={{ color: N.ink4 }}>·</span><Pill kind="live" size="xs"/></>}
          </div>
        </header>

        {/* Thread — completed history first, then ongoing streaming at bottom */}
        <div ref={chatRef} style={{ flex: 1, width: '100%', maxWidth: panelIn ? 680 : 760, padding: '80px 36px 16px', overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

          {/* All completed messages in chronological order */}
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              {msg.from === 'user' ? (
                // User message: left-border quote style (no black bubbles)
                <div style={{ paddingLeft: 14, borderLeft: `2px solid ${N.ink}`, animation: 'nn-fadeUp .4s ease both' }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: N.surface, color: N.ink2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, fontFamily: N.mono }}>U</span>
                    <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.05em' }}>tu · {msg.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.55, letterSpacing: '-0.005em' }}>{msg.text}</p>
                </div>
              ) : (
                // Nona message: free text with logo label
                <div style={{ animation: 'nn-fadeUp .4s ease both' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <Logo size={12}/>
                    <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{agentName} · {msg.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.65, letterSpacing: '-0.005em' }}>{renderMarkdown(msg.text)}</p>
                  {msg.fieldGuide && <FieldGuideCard guide={msg.fieldGuide}/>}
                  {msg.scenarios && msg.scenarios.length > 0 && <ScenarioPanel scenarios={msg.scenarios}/>}
                  {msg.actionGate && <ProtocolCard gate={msg.actionGate}/>}
                  {msg.quickReplies && (
                    <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {msg.quickReplies.map(r => <button key={r} onClick={() => setInputValue(r)} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`, background: N.white, color: N.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: N.sans }}>{r}</button>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* WS5: Handoff card — relief + first action + Telegram CTA */}
          {caseSlug && (() => {
            const en = locale === 'en'
            // is_hard from the action gate → first step from the web mirror sequencer (fresh case = h0_6)
            const isHard = !!caseActionGate && (caseActionGate.crowd_response_blocked === true || caseActionGate.active_search_permitted === false)
            const firstStep = buildStepSequence('h0_6', isHard)[0]?.title
            // honest status: -1 sentinel = pending; 0 = nothing reached yet; >0 = real confirmed
            const canils = proAlert?.canils ?? -1
            const vets = proAlert?.vets ?? -1
            const pending = canils < 0 || vets < 0
            const nobody = !pending && canils === 0 && vets === 0
            const statusLine = pending || nobody
              ? (en ? 'Nona is assembling your local network…' : 'A Nona está a montar a tua rede local…')
              : (en
                  ? `✓ Network alerted · ${canils} shelter(s) · ${vets} vet(s)`
                  : `✓ Rede avisada · ${canils} ${canils === 1 ? 'canil' : 'canis'} · ${vets} ${vets === 1 ? 'veterinário' : 'veterinários'}`)
            const tgUrl = ownerToken ? `https://t.me/${TELEGRAM_BOT}?start=${ownerToken}` : `https://t.me/${TELEGRAM_BOT}`
            return (
              <div style={{ marginBottom: 16, padding: '18px 20px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, display: 'grid', gap: 14, boxShadow: '0 8px 28px -12px rgba(11,12,16,.12)' }}>
                {/* relief — honest status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
                    {(pending || nobody) && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>}
                  </span>
                  <span style={{ fontFamily: N.mono, fontSize: 11.5, color: N.ink2 }}>{statusLine}</span>
                </div>
                {/* hope + first action */}
                {firstStep && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {en ? 'your first action' : 'a tua primeira ação'}
                    </p>
                    <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.5, letterSpacing: '-0.005em' }}>{firstStep}</p>
                  </div>
                )}
                {/* primary CTA → Telegram */}
                <a href={tgUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, background: N.ink, color: N.paper, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: N.sans }}>
                  {en ? 'Continue in Telegram — one step at a time →' : 'Continua no Telegram — cada passo, um de cada vez →'}
                </a>
                {/* secondary — no Telegram fallback */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  {ownerToken && (
                    <a href={`/${locale}/meu-caso/${ownerToken}`} style={{ fontSize: 12.5, color: N.ink3, textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: N.sans }}>
                      {en ? 'Prefer to continue here' : 'Prefiro continuar aqui'}
                    </a>
                  )}
                  <a href={`/${locale}/caso/${caseSlug}`} style={{ fontSize: 12.5, color: N.ink3, textDecoration: 'none', fontFamily: N.sans }}>
                    {en ? 'View case →' : 'Ver caso →'}
                  </a>
                </div>
              </div>
            )
          })()}

          {/* Quick replies (last agent turn) */}
          {quickReplies.length > 0 && !streaming && (
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickReplies.map(r => <button key={r} onClick={() => setInputValue(r)} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`, background: N.white, color: N.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: N.sans }}>{r}</button>)}
            </div>
          )}

          {/* Ongoing: thinking indicator */}
          {phase === 3 && (
            <div style={{ marginBottom: 24, animation: 'nn-fadeUp .4s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Logo size={12}/>
                <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona · a ouvir</span>
              </div>
              <p style={{ margin: 0, fontFamily: N.display, fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: N.ink3, letterSpacing: '-0.01em' }}>
                a processar
                <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: N.ink3, animation: 'nn-pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}/>)}
                </span>
              </p>
            </div>
          )}

          {/* Ongoing: streaming response (always at bottom) */}
          {phase >= 4 && (nonaText || nonaActions.length > 0) && (
            <div style={{ marginBottom: 24, animation: 'nn-fadeUp .4s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Logo size={12}/>
                <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona</span>
              </div>
              {nonaText && (
                <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.65, letterSpacing: '-0.005em' }}>
                  {renderMarkdown(nonaText)}
                  {streaming && <span style={{ display: 'inline-block', width: '0.5em', height: '1em', verticalAlign: '-.15em', background: N.ink, marginLeft: 2, animation: 'nn-blink 1.1s steps(1) infinite' }}/>}
                </p>
              )}
              {nonaActions.length > 0 && <InlineActionList items={nonaActions}/>}
              {probabilityScenarios.length > 0 && <ScenarioPanel scenarios={probabilityScenarios}/>}
            </div>
          )}
        </div>

        {/* Reply input */}
        <div style={{ width: '100%', maxWidth: panelIn ? 680 : 760, padding: '0 36px' }}>
          <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, padding: '14px 16px 12px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 8px 24px -8px rgba(11,12,16,.10)' }}>
            {/* Attached photo preview */}
            {(stagedPhoto || uploadingPhoto) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {stagedPhoto && <img src={stagedPhoto.preview} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }}/>}
                <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
                  {uploadingPhoto ? 'a carregar foto…' : 'foto anexada'}
                </span>
                {stagedPhoto && (
                  <button onClick={() => setStagedPhoto(null)} style={{ border: 'none', background: 'transparent', color: N.ink4, cursor: 'pointer', fontSize: 12 }}>remover</button>
                )}
              </div>
            )}
            <AutoTextarea value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} placeholder={transcribing ? 'a transcrever…' : recording ? 'a gravar — toca no micro para parar' : 'responde à nona…'} minHeight={22} fontSize={14.5} disabled={streaming || !inChat}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => fileInputRef.current?.click()} title="Anexar foto"
                  style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, cursor: 'pointer' }}>
                  <Icon name="photo" size={14} color={N.ink3}/>
                </button>
                <button onClick={toggleRecording} title={recording ? 'Parar gravação' : 'Gravar voz'}
                  style={{ padding: 7, borderRadius: 7, border: 'none', background: recording ? N.roseBg : 'transparent', color: recording ? N.rose : N.ink3, cursor: 'pointer' }}>
                  <Icon name="mic" size={14} color={recording ? N.rose : N.ink3}/>
                </button>
              </div>
              <button onClick={() => handleSubmit()} disabled={(!inputValue.trim() && !stagedPhoto) || streaming} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', background: ((!inputValue.trim() && !stagedPhoto) || streaming) ? N.rule : N.ink, color: N.paper, cursor: ((!inputValue.trim() && !stagedPhoto) || streaming) ? 'default' : 'pointer', transition: 'background .15s' }}>
                <Icon name="arrowUp" size={15} color={N.paper} sw={2}/>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      )}

      {/* ══ AGENT ASSIGNMENT OVERLAY (#55) ══ */}
      {assigning && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,250,248,0.88)', backdropFilter: 'blur(16px)' }}>
          <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 20, padding: '28px 36px', minWidth: 300, boxShadow: '0 24px 64px -12px rgba(11,12,16,.18)', animation: 'nn-fadeUp .4s ease both' }}>
            <p style={{ margin: '0 0 18px', fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              a atribuir investigador
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {candidates.map((name, i) => {
                const revealed = assignStep > i
                const selected = name === agentName && revealed
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 13px', borderRadius: 10, background: selected ? N.ink : revealed ? N.surface : 'transparent', border: `1px solid ${selected ? N.ink : revealed ? N.rule : 'transparent'}`, opacity: revealed ? 1 : 0.12, transition: 'all .35s ease' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: selected ? N.paper : N.rule, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, fontFamily: N.mono, color: selected ? N.ink : N.ink3, flexShrink: 0 }}>
                      {name[0]}
                    </span>
                    <span style={{ fontFamily: N.display, fontSize: 15, letterSpacing: '-0.01em', color: selected ? N.paper : N.ink, flex: 1 }}>{name}</span>
                    {selected && <span style={{ fontFamily: N.mono, fontSize: 9.5, color: selected ? N.paper : N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>atribuído ✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ ACTIVITY PANEL ══ */}
      <motion.div
        animate={{ x: panelIn ? 0 : 360, opacity: panelIn ? 1 : 0 }}
        initial={false}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        style={{ position: 'fixed', top: 0, bottom: 0, right: 0, width: 360, background: N.paper, borderLeft: `1px solid ${N.rule}`, padding: '64px 20px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>atividade da nona</span>
          <Pill kind="live" size="xs"/>
        </div>
        {agentEvents.length > 0
          ? <AgentFeed title="Acabou de fazer" events={agentEvents.slice(0, 8)} footer={false} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}/>
          : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>aguardando acções…</span></div>}
        <p style={{ margin: 0, fontFamily: N.mono, fontSize: 10.5, color: N.ink4, lineHeight: 1.5 }}>o painel só aparece quando há algo para mostrar.</p>
      </motion.div>
    </div>
  )
}

const TOOL_LABELS: Record<string, string> = {
  identify_dog: 'Identifiquei o cão', search_similar: 'Verifiquei contra cães encontrados',
  normalize_location: 'Normalizei a localização', create_case: 'Criei a página pública',
  generate_poster: 'Gerei o cartaz A4', notify_volunteers: 'Notifiquei voluntários da zona',
}
