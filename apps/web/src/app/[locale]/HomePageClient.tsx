'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { Icon } from '@/components/nona/Icon'
import { PhotoPlaceholder } from '@/components/nona/PhotoPlaceholder'
import { Pill } from '@/components/nona/Pill'
import { AgentFeed, type AgentEvent } from '@/components/nona/AgentFeed'

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

interface ChatMessage {
  from: 'user' | 'agent'
  text: string
  time: string
  quickReplies?: string[] | undefined
  scenarios?: ProbabilityScenario[]
  actionGate?: ActionGate
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
  const [streaming, setStreaming] = useState(false)
  const [probabilityScenarios, setProbabilityScenarios] = useState<ProbabilityScenario[]>([])
  const chatRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = useCallback(async () => {
    const text = inputValue.trim()
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
    let scenariosSnap: ProbabilityScenario[] = []
    let actionGateSnap: ActionGate | undefined = undefined
    const events: AgentEvent[] = []
    const actions: ActionItem[] = []

    try {
      // Pass existing messages as history so Claude maintains context across turns
      const history = messages.map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      const res = await fetch('/api/intake/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode, history, agentName }),
      })
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
              }
            } else if (evt['type'] === 'case_created') {
              setCaseSlug(String(evt['slug'] ?? ''))
              if (evt['ownerToken']) setOwnerToken(String(evt['ownerToken']))
            } else if (evt['type'] === 'quick_replies') {
              setQuickReplies(Array.isArray(evt['replies']) ? evt['replies'] as string[] : [])
            } else if (evt['type'] === 'done') {
              const qr = Array.isArray(evt['quick_replies']) ? evt['quick_replies'] as string[] : []
              setMessages(prev => [...prev, { from: 'agent' as const, text: accumulated, time: formatTime(), ...(qr.length > 0 ? { quickReplies: qr } : {}), ...(scenariosSnap.length > 0 ? { scenarios: scenariosSnap } : {}), ...(actionGateSnap ? { actionGate: actionGateSnap } : {}) }])
              setProbabilityScenarios([])
              setNonaText(''); setNonaActions([])
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('intake stream error', err)
    } finally {
      setStreaming(false); scrollChat()
    }
  }, [inputValue, mode, messages, scrollChat])

  const inChat = phase >= 1
  const panelIn = phase >= 4

  return (
    <div className="nn" style={{ position: 'fixed', inset: 0, background: N.paper, overflow: 'hidden' }}>

      {/* ══ CHROME — home nav, hero, reunidos, footer ══ */}
      {/* Chrome includes the "real" hero input the user types into.           */}
      {/* When phase≥1 it fades away while the canvas expands over it.         */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, opacity: phase === 0 ? 1 : 0, transition: 'opacity .45s ease', pointerEvents: phase === 0 ? 'auto' : 'none', overflowY: 'auto' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: N.paper, borderBottom: `1px solid ${N.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Logo size={18}/>
            <nav style={{ display: 'flex', gap: 22 }}>
              {[{ label: 'Casos', href: `/${locale}/casos` }, { label: 'Como funciona', href: '#como' }, { label: 'Comunidade', href: '#comunidade' }].map(item => (
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6vh 0 0' }}>
        <div style={{ width: 720, maxWidth: '90vw' }}>
          <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11.5, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            agente para cães perdidos · algarve
          </p>
          <h1 style={{ margin: '14px 0 0', fontFamily: N.display, fontWeight: 400, fontSize: 76, letterSpacing: '-0.025em', lineHeight: 0.98, color: N.ink } as React.CSSProperties}>
            Diz-me o que se passou.<br/><span style={{ fontStyle: 'italic' }}>Eu trato de tudo.</span>
          </h1>
          <p style={{ margin: '20px auto 0', maxWidth: 480, fontSize: 15.5, color: N.ink2, lineHeight: 1.55 }}>
            Cartaz, redes sociais, voluntários, monitorização de avistamentos. Em segundos, sem formulários.
          </p>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald }}/>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N.emerald, animation: 'nn-ping 2.2s cubic-bezier(0,0,.2,1) infinite' }}/>
            </span>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
              {activeAgentsCount} investigadores disponíveis agora
            </span>
          </div>
          <div style={{ display: 'inline-flex', marginTop: 16, padding: 3, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 999, gap: 2 }}>
            {([{ id: 'lost' as Mode, label: 'perdi um cão', accent: N.rose }, { id: 'found' as Mode, label: 'encontrei um cão', accent: N.emerald }]).map(o => (
              <button key={o.id} onClick={() => setMode(o.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, border: 'none', background: mode === o.id ? N.ink : 'transparent', color: mode === o.id ? N.paper : N.ink2, fontSize: 13, fontWeight: 500, transition: 'all .15s ease', cursor: 'pointer', fontFamily: N.sans }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.accent }}/>{o.label}
              </button>
            ))}
          </div>

          {/* Hero input — measured to anchor canvas expansion */}
          <div ref={heroInputRef} style={{ marginTop: 16, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 18, padding: '20px 22px 14px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 14px 36px -10px rgba(11,12,16,.10)', textAlign: 'left' }}>
            <AutoTextarea value={inputValue} onChange={setInputValue} onSubmit={handleSubmit}
              placeholder={mode === 'lost' ? 'Descreve o teu cão e onde o perdeste...' : 'Descreve o cão que encontraste e onde...'}
              minHeight={56} fontSize={18}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${N.ruleSoft}` }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ icon: 'photo' as const, label: 'foto' }, { icon: 'pin' as const, label: 'local' }, { icon: 'clock' as const, label: 'quando' }].map(t => (
                  <button key={t.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, fontSize: 12.5, cursor: 'pointer', fontFamily: N.sans }}>
                    <Icon name={t.icon} size={14} color={N.ink3}/>{t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
                <span>pt · en · es</span>
                <button onClick={handleSubmit} disabled={!inputValue.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: 'none', background: inputValue.trim() ? N.ink : N.rule, color: inputValue.trim() ? N.paper : N.ink4, fontSize: 13, fontWeight: 500, fontFamily: N.sans, cursor: inputValue.trim() ? 'pointer' : 'default', transition: 'all .15s ease' }}>
                  começar <Icon name="enter" size={12} color={inputValue.trim() ? N.paper : N.ink4}/>
                </button>
              </div>
            </div>
          </div>
          <p style={{ margin: '10px 0 0', fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>
            ou <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>cmd ↵</span>
            {' '}·{' '}prefere voz?{' '}
            <a href="https://t.me/salvacao_bot" style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>telegram</a>
            {' '}·{' '}<span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>whatsapp</span>
          </p>
        </div>{/* end width-720 */}
        </div>{/* end hero center */}

        <div style={{ padding: '48px 32px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>reunidos esta semana · {reunidosCount}</span>
            <a href={`/${locale}/casos`} style={{ fontSize: 12, color: N.ink2, textDecoration: 'none' }}>ver todos →</a>
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
        </div>{/* end maxWidth 900 */}
        </div>{/* end cases padding */}

        <footer style={{ marginTop: 48, padding: '16px 32px', borderTop: `1px solid ${N.rule}`, display: 'flex', justifyContent: 'space-between', fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
          <span>nona · open source · made in algarve · 2026</span>
          <span style={{ display: 'flex', gap: 18 }}><span>privacidade</span><span>como funciona</span><span>parceiros</span></span>
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
            <span>nona · claude-haiku-4.5</span>
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

          {/* Case created CTA */}
          {caseSlug && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: N.emeraldBg, border: `1px solid ${N.emerald}22`, borderRadius: 12, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, color: N.emeraldDeep, fontWeight: 500 }}>Caso criado</span>
                <a href={`/${locale}/caso/${caseSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: N.emerald, color: N.white, fontSize: 12.5, fontWeight: 500, textDecoration: 'none', fontFamily: N.sans }}>Ver caso <Icon name="arrow" size={12} color={N.white}/></a>
              </div>
              {ownerToken && (
                <a href={`/${locale}/meu-caso/${ownerToken}`} style={{ fontSize: 12.5, color: N.emeraldDeep, textDecoration: 'none', fontWeight: 500 }}>
                  → Painel do dono (privado)
                </a>
              )}
            </div>
          )}

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
            <AutoTextarea value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} placeholder="responde à nona…" minHeight={22} fontSize={14.5} disabled={streaming || !inChat}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {(['photo','camera','pin'] as const).map(ic => (
                  <button key={ic} style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, cursor: 'pointer' }}><Icon name={ic} size={14} color={N.ink3}/></button>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={!inputValue.trim() || streaming} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', background: (!inputValue.trim() || streaming) ? N.rule : N.ink, color: N.paper, cursor: (!inputValue.trim() || streaming) ? 'default' : 'pointer', transition: 'background .15s' }}>
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
