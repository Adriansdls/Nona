'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { Icon } from '@/components/nona/Icon'
import { PhotoPlaceholder } from '@/components/nona/PhotoPlaceholder'
import { Pill } from '@/components/nona/Pill'
import { AgentFeed, type AgentEvent } from '@/components/nona/AgentFeed'

// ─── Types ──────────────────────────────────────────────────────────
type Mode = 'lost' | 'found'
type Phase = 0 | 1 | 2 | 3 | 4

interface ChatMessage {
  from: 'user' | 'agent'
  text: string
  time: string
  quickReplies?: string[] | undefined
}

interface RecentReunido {
  id: string
  dog_name: string | null
  breed: string
  last_seen_municipality: string
  resolved_at: string | null
  case_images: Array<{ public_url: string | null; is_primary: boolean }>
}

const TONES = ['cocoa','sand','rose','moss','slate','cream','midnight'] as const

function formatTime() {
  return new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── InlineActionList ────────────────────────────────────────────────
interface ActionItem { label: string; detail?: string; live?: boolean }
function InlineActionList({ items }: { items: ActionItem[] }) {
  return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: N.ink2, lineHeight: 1.45 }}>
            <span style={{
              marginTop: 3, width: 14, height: 14, borderRadius: 4,
              background: it.live ? N.amberBg : N.emeraldBg,
              color: it.live ? N.amber : N.emerald,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {it.live ? (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N.amber, animation: 'nn-pulse 1.4s ease-in-out infinite' }}/>
              ) : (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={N.emerald} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 12.5 9 17.5 20 6.5"/>
                </svg>
              )}
            </span>
            <span>
              <span style={{ color: N.ink, fontWeight: 500 }}>{it.label}</span>
              {it.detail && <span style={{ color: N.ink3 }}> · {it.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Chat bubble ────────────────────────────────────────────────────
interface BubbleProps {
  from: 'user' | 'agent'
  children: React.ReactNode
  time: string
}
function ChatBubble({ from, children, time }: BubbleProps) {
  const isUser = from === 'user'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {!isUser && <Logo size={11}/>}
        <span>{isUser ? 'tu' : 'nona'}</span>
        <span style={{ color: N.ink4 }}>· {time}</span>
      </div>
      <div style={{
        maxWidth: '88%',
        padding: isUser ? '12px 16px' : '0',
        borderRadius: isUser ? 14 : 0,
        background: isUser ? N.ink : 'transparent',
        color: isUser ? N.paper : N.ink,
        fontSize: 15.5, lineHeight: 1.5, letterSpacing: '-0.005em',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Auto-grow textarea ──────────────────────────────────────────────
interface AutoTextareaProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder: string
  minHeight: number
  fontSize: number
  disabled?: boolean
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
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit() }
      }}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: '100%', resize: 'none', border: 'none', outline: 'none',
        background: 'transparent', minHeight, fontSize, color: N.ink,
        lineHeight: 1.45, letterSpacing: '-0.005em', fontFamily: N.sans,
        display: 'block',
      }}
      rows={1}
    />
  )
}

// ─── Main component ──────────────────────────────────────────────────
interface HomePageClientProps {
  locale: string
  reunidosCount: number
  recentReunidos: RecentReunido[]
}

export function HomePageClient({ locale, reunidosCount, recentReunidos }: HomePageClientProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('lost')
  const [phase, setPhase] = useState<Phase>(0)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([])
  const [nonaText, setNonaText] = useState('')
  const [nonaActions, setNonaActions] = useState<ActionItem[]>([])
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [caseSlug, setCaseSlug] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const scrollChat = useCallback(() => {
    requestAnimationFrame(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const text = inputValue.trim()
    if (!text) return

    const userMsg: ChatMessage = { from: 'user', text, time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setPhase(2)

    setTimeout(() => setPhase(3), 400)
    scrollChat()

    setStreaming(true)
    let accumulated = ''
    const events: AgentEvent[] = []
    const actions: ActionItem[] = []

    try {
      const res = await fetch(`/api/intake/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, mode }),
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
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'text_delta') {
              accumulated += evt.delta
              setNonaText(accumulated)
              scrollChat()
            } else if (evt.type === 'tool_start') {
              const toolLabel = TOOL_LABELS[evt.tool as string] ?? evt.tool
              events.push({ t: formatTime(), kind: 'tool', label: toolLabel })
              setAgentEvents([...events])
            } else if (evt.type === 'tool_result') {
              const last = events[events.length - 1]
              if (last) {
                last.code = evt.code
                last.result = evt.result
                if (evt.status === 'live') last.status = 'live'
                actions.push({ label: last.label, detail: evt.result, live: evt.status === 'live' })
              }
              setAgentEvents([...events])
              setNonaActions([...actions])
            } else if (evt.type === 'case_created') {
              setCaseSlug(evt.slug as string)
            } else if (evt.type === 'quick_replies') {
              setQuickReplies(evt.replies as string[])
            } else if (evt.type === 'done') {
              const agentMsg: ChatMessage = {
                from: 'agent', text: accumulated, time: formatTime(),
                ...(Array.isArray(evt.quick_replies) ? { quickReplies: evt.quick_replies as string[] } : {}),
              }
              setMessages(prev => [...prev, agentMsg])
              setNonaText('')
              setNonaActions([])
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      console.error('intake stream error', err)
    } finally {
      setStreaming(false)
      scrollChat()
    }
  }, [inputValue, mode, locale, scrollChat])

  const homeChrome = phase === 0 ? 1 : 0
  const inputCentered = phase >= 1
  const hasMessage = phase >= 2
  const nonaThinking = phase === 3
  const nonaWorking = phase >= 4
  const panelIn = phase >= 4

  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── HOME NAV — fades at phase 1 ── */}
      <div style={{ opacity: homeChrome, transition: 'opacity .7s cubic-bezier(.4,0,.2,1)', pointerEvents: phase === 0 ? 'auto' : 'none', position: phase === 0 ? 'static' : 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: N.paper, borderBottom: `1px solid ${N.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Logo size={18}/>
            <nav style={{ display: 'flex', gap: 22 }}>
              {[
                { label: 'Casos', href: `/${locale}/casos` },
                { label: 'Como funciona', href: '#como' },
                { label: 'Comunidade', href: '#comunidade' },
              ].map(item => (
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
      </div>

      {/* ── COMPACT NAV for chat phase ── */}
      {phase >= 1 && (
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', borderBottom: `1px solid ${N.rule}`, background: N.paper,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity .4s ease .3s',
          pointerEvents: phase >= 1 ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Logo size={18}/>
            {caseSlug && (
              <>
                <span style={{ width: 1, height: 16, background: N.rule }}/>
                <span style={{ fontFamily: N.mono, fontSize: 11.5, color: N.ink3 }}>
                  <span>caso · </span>
                  <a href={`/${locale}/caso/${caseSlug}`} style={{ color: N.ink, textDecoration: 'none' }}>{caseSlug}</a>
                </span>
                <Pill kind="active" size="xs"/>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
            <span><Icon name="sparkle" size={11} color={N.indigo}/></span>
            <span>nona · claude-haiku-4.5</span>
            {streaming && (
              <>
                <span style={{ color: N.ink4 }}>·</span>
                <Pill kind="live" size="xs"/>
              </>
            )}
          </div>
        </header>
      )}

      {/* ── HOME HERO — fades at phase 1 ── */}
      <div style={{
        position: phase === 0 ? 'static' : 'absolute',
        top: 57, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: phase === 0 ? '0 32px' : '0',
        opacity: homeChrome, transition: 'opacity .7s cubic-bezier(.4,0,.2,1)',
        pointerEvents: phase === 0 ? 'auto' : 'none',
      }}>
        <div style={{ width: '100%', maxWidth: 720, textAlign: 'center', paddingTop: 88 }}>
          <p style={{ margin: 0, fontFamily: N.mono, fontSize: 11.5, color: N.ink3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            agente para cães perdidos · algarve
          </p>
          <h1 style={{ margin: '24px 0 0', fontFamily: N.display, fontWeight: 400, fontSize: 90, letterSpacing: '-0.025em', lineHeight: 0.98, color: N.ink } as React.CSSProperties}>
            Diz-me o que se passou.<br/>
            <span style={{ fontStyle: 'italic', color: N.ink, fontWeight: 400 }}>Eu trato de tudo.</span>
          </h1>
          <p style={{ margin: '24px auto 0', maxWidth: 480, fontSize: 16, color: N.ink2, lineHeight: 1.55 }}>
            Cartaz, redes sociais, voluntários, monitorização de avistamentos. Em segundos, sem formulários.
          </p>

          {/* mode toggle */}
          <div style={{ display: 'inline-flex', marginTop: 36, padding: 3, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 999, gap: 2 }}>
            {([
              { id: 'lost'  as Mode, label: 'perdi um cão',     accent: N.rose },
              { id: 'found' as Mode, label: 'encontrei um cão', accent: N.emerald },
            ]).map(o => (
              <button key={o.id} onClick={() => setMode(o.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 999, border: 'none',
                background: mode === o.id ? N.ink : 'transparent',
                color: mode === o.id ? N.paper : N.ink2,
                fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
                transition: 'all .15s ease', cursor: 'pointer', fontFamily: N.sans,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: o.accent }}/>
                {o.label}
              </button>
            ))}
          </div>

          {/* INPUT BOX */}
          <div style={{ marginTop: 18, position: 'relative', textAlign: 'left', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 18, padding: '20px 22px 14px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 14px 36px -10px rgba(11,12,16,.10)' }}>
            <AutoTextarea
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              placeholder={mode === 'lost' ? 'Descreve o teu cão e onde o perdeste...' : 'Descreve o cão que encontraste e onde...'}
              minHeight={56}
              fontSize={18}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${N.ruleSoft}` }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { icon: 'photo' as const, label: 'foto' },
                  { icon: 'pin'   as const, label: 'local' },
                  { icon: 'clock' as const, label: 'quando' },
                ].map(t => (
                  <button key={t.icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, fontSize: 12.5, cursor: 'pointer', fontFamily: N.sans }}>
                    <Icon name={t.icon} size={14} color={N.ink3}/> {t.label}
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
          <p style={{ margin: '12px 0 0', fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>
            ou <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>cmd ↵</span>
            &nbsp;·&nbsp; prefere voz?{' '}
            <a href={`https://t.me/salvacao_bot`} style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>telegram</a>
            {' '}·{' '}
            <span style={{ color: N.ink, textDecoration: 'underline', textUnderlineOffset: 3 }}>whatsapp</span>
          </p>
        </div>

        {/* recent reunidos */}
        <div style={{ marginTop: 88, width: '100%', maxWidth: 980, paddingBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              reunidos esta semana · {reunidosCount}
            </span>
            <a href={`/${locale}/casos`} style={{ fontSize: 12, color: N.ink2, textDecoration: 'none' }}>ver todos →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {(recentReunidos.length > 0 ? recentReunidos : Array.from({ length: 7 })).map((d, i) => {
              const case_ = d as RecentReunido | undefined
              const tone = TONES[i % TONES.length] ?? 'cocoa'
              const primaryImg = case_?.case_images?.find(img => img.is_primary)
              const daysAgo = case_?.resolved_at
                ? Math.floor((Date.now() - new Date(case_.resolved_at).getTime()) / 86400000)
                : null
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {primaryImg?.public_url ? (
                    <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1/1' }}>
                      <img src={primaryImg.public_url} alt={case_?.dog_name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    </div>
                  ) : (
                    <PhotoPlaceholder tone={tone} radius={10} ratio="1/1"/>
                  )}
                  {case_ && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: N.display, fontSize: 16, letterSpacing: '-0.015em' }}>{case_.dog_name ?? case_.breed}</span>
                        {daysAgo !== null && <span style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3 }}>{daysAgo}d</span>}
                      </div>
                      <span style={{ fontSize: 11, color: N.ink3 }}>{case_.last_seen_municipality}</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CHAT SURFACE — slides in at phase 1 ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: inputCentered ? 'flex-end' : 'flex-start',
        paddingTop: inputCentered ? 57 : 600,
        paddingBottom: inputCentered ? 32 : 0,
        paddingRight: panelIn ? 360 : 0,
        transition: 'padding .6s cubic-bezier(.4,0,.2,1)',
        pointerEvents: phase === 0 ? 'none' : 'auto',
      }}>
        {/* thread */}
        <div
          ref={chatRef}
          style={{
            flex: inputCentered ? 1 : 'none',
            width: '100%', maxWidth: 640,
            padding: '0 28px', overflow: inputCentered ? 'auto' : 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            opacity: inputCentered ? 1 : 0,
            transition: 'opacity .4s ease .2s',
            paddingTop: 80,
          }}
        >
          {/* user message (phase 2+) */}
          {hasMessage && messages.length > 0 && (
            <div style={{ marginBottom: 24, paddingLeft: 12, borderLeft: `2px solid ${N.ink}`, animation: 'nn-fadeUp .55s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: N.surface, color: N.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 600, fontFamily: N.mono }}>U</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: N.ink }}>tu</span>
                <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>· {messages[0]?.time ?? ''}</span>
              </div>
              <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.55, letterSpacing: '-0.005em' }}>{messages[0]?.text ?? ''}</p>
            </div>
          )}

          {/* nona thinking (phase 3) */}
          {nonaThinking && (
            <div style={{ marginBottom: 24, animation: 'nn-fadeUp .5s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <Logo size={12}/>
                <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona · a ouvir</span>
              </div>
              <p style={{ margin: 0, fontFamily: N.display, fontStyle: 'italic', fontSize: 20, fontWeight: 400, color: N.ink3, letterSpacing: '-0.01em' }}>
                a processar
                <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: N.ink3, animation: 'nn-pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}/>
                  ))}
                </span>
              </p>
            </div>
          )}

          {/* nona streaming response (phase 4+) */}
          {nonaWorking && (nonaText || nonaActions.length > 0) && (
            <div style={{ marginBottom: 24, animation: 'nn-fadeUp .55s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Logo size={12}/>
                <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>nona</span>
              </div>
              {nonaText && (
                <p style={{ margin: 0, fontSize: 15.5, color: N.ink, lineHeight: 1.6, letterSpacing: '-0.005em' }}>
                  {nonaText}
                  {streaming && <span style={{ display: 'inline-block', width: '0.5em', height: '1em', verticalAlign: '-.15em', background: N.ink, marginLeft: 2, animation: 'nn-blink 1.1s steps(1) infinite' }}/>}
                </p>
              )}
              {nonaActions.length > 0 && <InlineActionList items={nonaActions}/>}
            </div>
          )}

          {/* completed messages */}
          {messages.slice(1).map((msg, i) => (
            <ChatBubble key={i + 1} from={msg.from} time={msg.time}>
              <p style={{ margin: 0 }}>{msg.text}</p>
              {msg.quickReplies && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {msg.quickReplies.map(reply => (
                    <button key={reply} onClick={() => { setInputValue(reply); handleSubmit() }} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`, background: N.white, color: N.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: N.sans }}>
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </ChatBubble>
          ))}

          {/* quick replies from last agent message */}
          {quickReplies.length > 0 && !streaming && (
            <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {quickReplies.map(reply => (
                <button key={reply} onClick={() => { setInputValue(reply); setTimeout(handleSubmit, 0) }} style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${N.rule}`, background: N.white, color: N.ink, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: N.sans }}>
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* case created CTA */}
          {caseSlug && (
            <div style={{ marginBottom: 12, padding: '12px 16px', background: N.emeraldBg, border: `1px solid ${N.emerald}22`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: N.emeraldDeep, fontWeight: 500 }}>Caso criado</span>
              <a href={`/${locale}/caso/${caseSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: N.emerald, color: N.white, fontSize: 12.5, fontWeight: 500, textDecoration: 'none', fontFamily: N.sans }}>
                Ver caso <Icon name="arrow" size={12} color={N.white}/>
              </a>
            </div>
          )}
        </div>

        {/* input (thread mode) */}
        {inputCentered && (
          <div style={{ width: '100%', maxWidth: 640, padding: '0 28px' }}>
            <div style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, padding: '14px 16px 12px', boxShadow: '0 1px 0 rgba(11,12,16,.02), 0 8px 24px -8px rgba(11,12,16,.10)' }}>
              <AutoTextarea
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                placeholder="responde à nona…"
                minHeight={22}
                fontSize={14.5}
                disabled={streaming}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['photo','camera','pin'] as const).map(ic => (
                    <button key={ic} style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', color: N.ink3, cursor: 'pointer' }}>
                      <Icon name={ic} size={14} color={N.ink3}/>
                    </button>
                  ))}
                </div>
                <button onClick={handleSubmit} disabled={!inputValue.trim() || streaming} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', background: (!inputValue.trim() || streaming) ? N.rule : N.ink, color: N.paper, cursor: (!inputValue.trim() || streaming) ? 'default' : 'pointer', transition: 'background .15s' }}>
                  <Icon name="arrowUp" size={15} color={N.paper} sw={2}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIVITY PANEL — slides in from right at phase 4 ── */}
      <div style={{
        position: 'fixed', top: 0, bottom: 0, right: 0, width: 360,
        transform: panelIn ? 'translateX(0)' : 'translateX(100%)',
        opacity: panelIn ? 1 : 0,
        transition: 'transform .65s cubic-bezier(.4,0,.2,1), opacity .65s ease .05s',
        background: N.paper, borderLeft: `1px solid ${N.rule}`,
        padding: '64px 20px 24px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 12,
        zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            atividade da nona
          </span>
          <Pill kind="live" size="xs"/>
        </div>
        {agentEvents.length > 0 ? (
          <AgentFeed
            title="Acabou de fazer"
            events={agentEvents.slice(0, 8)}
            footer={false}
            style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink4 }}>aguardando acções…</span>
          </div>
        )}
        <p style={{ margin: 0, fontFamily: N.mono, fontSize: 10.5, color: N.ink4, lineHeight: 1.5 }}>
          o painel só aparece quando há algo para mostrar.
        </p>
      </div>

      {/* ── HOME FOOTER — fades at phase 1 ── */}
      <footer style={{
        position: phase === 0 ? 'static' : 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '20px 32px', borderTop: `1px solid ${N.rule}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: N.mono, fontSize: 11, color: N.ink3,
        background: N.paper,
        opacity: homeChrome, transition: 'opacity .7s cubic-bezier(.4,0,.2,1)',
        pointerEvents: phase === 0 ? 'auto' : 'none',
        marginTop: 'auto',
      }}>
        <span>nona · open source · made in algarve · 2026</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <span>privacidade</span><span>como funciona</span><span>parceiros</span>
        </span>
      </footer>
    </div>
  )
}

const TOOL_LABELS: Record<string, string> = {
  identify_dog:        'Identifiquei o cão',
  search_similar:      'Verifiquei contra cães encontrados',
  normalize_location:  'Normalizei a localização',
  create_case:         'Criei a página pública',
  generate_poster:     'Gerei o cartaz A4',
  notify_volunteers:   'Notifiquei voluntários da zona',
}
