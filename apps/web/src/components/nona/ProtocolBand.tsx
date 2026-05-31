'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { N } from './tokens'
import { Btn } from './Btn'
import { Icon } from './Icon'

/**
 * The case page centrepiece — "what to do now" — but ROLE-AWARE:
 *   • observer (default): how to HELP — observe, don't chase/call, report.
 *   • owner (?t=token):   the time-phased recovery protocol.
 * Feels alive: the first step is the highlighted "AGORA", with a ticking
 * "next activity window" cue and a live pulse, so the band visibly changes.
 */

export interface OwnerBucket {
  label: string
  items: string[]
  warning?: string | undefined
}

type Step = { text: string; sub?: string }

function observerPlay(args: {
  dogName: string
  fearful: boolean      // galgo / xenophobic / blind_panic / crowd-blocked
  zone: string
}): { label: string; title: string; steps: Step[]; gate: string } {
  const { dogName, fearful, zone } = args
  return {
    label: 'É observador',
    title: 'Como ajudar agora',
    steps: [
      { text: `Fique atento na sua zona`, sub: `valas, quintais, zonas de sombra e de água perto de ${zone}` },
      { text: `Se vir ${dogName}, pare e observe de longe`, sub: fearful ? `é um cão medroso — aproximar-se ou chamar afasta-o (pode ir para a estrada)` : `não corra atrás nem grite — pode assustá-lo` },
      { text: `Tire uma foto e marque o local`, sub: `mesmo de longe e desfocada ajuda a confirmar a zona` },
      { text: `Reporte aqui — a equipa trata do resto`, sub: `não precisa de o apanhar; o seu aviso entra no caso na hora` },
    ],
    gate: fearful
      ? `Cão em modo de sobrevivência: NÃO perseguir, NÃO chamar, NÃO juntar pessoas.`
      : `Regra de ouro: observar, nunca perseguir.`,
  }
}

function nextWindowCue(): string | null {
  // Crepuscular activity windows; show the next one + countdown so the band ticks.
  const now = new Date()
  const m = now.getMonth() + 1
  const summer = m >= 6 && m <= 9
  const dawn = summer ? 6 : 7        // ~hour
  const dusk = summer ? 20 : 18
  const h = now.getHours() + now.getMinutes() / 60
  let target: number, label: string
  if (h < dawn) { target = dawn; label = 'amanhecer' }
  else if (h < dusk) { target = dusk; label = 'crepúsculo' }
  else { target = dawn + 24; label = 'amanhecer' }
  const mins = Math.round((target - h) * 60)
  const hh = Math.floor(mins / 60), mm = mins % 60
  const inLabel = hh > 0 ? `${hh}h ${mm}min` : `${mm}min`
  return `Próxima janela de maior actividade: ${label} · faltam ${inLabel}`
}

export function ProtocolBand({
  isOwner, ownerBucket, dogName, zone, fearful, accent, accentBg, slug, locale, isMobile,
}: {
  isOwner: boolean
  ownerBucket: OwnerBucket
  dogName: string
  zone: string
  fearful: boolean
  accent: string
  accentBg: string
  slug: string
  locale: string
  isMobile: boolean
}) {
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 60000); return () => clearInterval(id) }, [])

  const obs = observerPlay({ dogName, fearful, zone })
  const label = isOwner ? ownerBucket.label : obs.label
  const title = isOwner ? 'O que fazer agora' : obs.title
  const steps: Step[] = isOwner ? ownerBucket.items.map(t => ({ text: t })) : obs.steps
  const cue = nextWindowCue()

  return (
    <div id="protocol" style={{ background: N.white, border: `1px solid ${N.rule}`, borderLeft: `4px solid ${accent}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
      {/* header band */}
      <div style={{ padding: isMobile ? '18px 18px 14px' : '22px 28px 16px', background: accentBg, borderBottom: `1px solid ${N.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, animation: 'nn-pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: N.mono, fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <h2 style={{ margin: 0, fontFamily: N.display, fontSize: isMobile ? 30 : 38, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, color: N.ink }}>
          {title}
        </h2>
        <div style={{ marginTop: 8, fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
          passo 1 de {steps.length}{cue ? ` · ${cue}` : ''}
        </div>
      </div>

      {/* steps — first is the live "AGORA", rest secondary */}
      <ol style={{ margin: 0, padding: isMobile ? '8px 0' : '10px 0', listStyle: 'none' }}>
        {steps.map((s, i) => {
          const live = i === 0
          return (
            <li key={i} style={{
              display: 'grid', gridTemplateColumns: '44px 1fr', alignItems: 'start', gap: 4,
              padding: isMobile ? '12px 18px' : '14px 28px',
              borderBottom: i < steps.length - 1 ? `1px solid ${N.ruleSoft}` : 'none',
              background: live ? accentBg : 'transparent',
            }}>
              <span style={{ fontFamily: N.display, fontSize: 22, fontWeight: 400, color: accent, lineHeight: 1.2 }}>{i + 1}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? 15 : 16, color: N.ink, lineHeight: 1.4, fontWeight: live ? 600 : 450 } as React.CSSProperties}>{s.text}</span>
                  {live && <span style={{ fontFamily: N.mono, fontSize: 9.5, color: accent, letterSpacing: '0.1em', padding: '1px 6px', borderRadius: 5, border: `1px solid ${accent}55` }}>AGORA</span>}
                </div>
                {s.sub && <div style={{ marginTop: 3, fontSize: 13, color: N.ink3, lineHeight: 1.45 }}>{s.sub}</div>}
              </div>
            </li>
          )
        })}
      </ol>

      {/* footer: observer → safety gate + report CTA; owner → bucket warning */}
      {!isOwner ? (
        <div style={{ padding: isMobile ? '0 18px 18px' : '4px 28px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#991B1B', lineHeight: 1.45 }}>
            ⚠️ {obs.gate}
          </div>
          <Link href={`/${locale}/caso/${slug}/avistamento`} style={{ textDecoration: 'none' }}>
            <Btn variant="primary" tone="ink" size="lg" full icon={<Icon name="eye" size={16} color={N.paper} />}>Vi o {dogName} — reportar</Btn>
          </Link>
        </div>
      ) : ownerBucket.warning ? (
        <div style={{ margin: isMobile ? '0 18px 16px' : '0 28px 18px', padding: '12px 16px', background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, fontSize: 13.5, color: '#713F12', lineHeight: 1.5, display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0 }}>⚠️</span><span>{ownerBucket.warning}</span>
        </div>
      ) : null}
    </div>
  )
}
