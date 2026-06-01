'use client'
import React, { useState } from 'react'
import { N } from './tokens'
import { Btn } from './Btn'
import { Icon } from './Icon'

/**
 * Explicit Facebook / Telegram / WhatsApp share — the channels that actually
 * matter for a lost-dog case. Replaces the OS share sheet (which surfaced
 * Notes/AirDrop/etc. — useless here). `compact` renders just the 3 buttons
 * (for the hero); the default renders the full card with copy-link.
 */
export function SharePanel({
  dogName,
  caseUrl,
  compact = false,
}: {
  dogName: string
  caseUrl: string
  compact?: boolean
}) {
  const [fbCopied, setFbCopied] = useState(false)
  const [copied, setCopied] = useState(false)
  const suggested = `Ajuda a encontrar ${dogName}! ${caseUrl}`
  const shortUrl = caseUrl.replace(/^https?:\/\//, '')

  const share = (platform: string) => {
    if (platform === 'facebook') {
      // Meta removed share-dialog text prefill (2017) — copy the message so the
      // user pastes it in one tap, then open the sharer with the link.
      navigator.clipboard?.writeText(suggested).then(() => {
        setFbCopied(true)
        setTimeout(() => setFbCopied(false), 4000)
      }).catch(() => {})
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(caseUrl)}`, '_blank')
      return
    }
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(suggested)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(caseUrl)}&text=${encodeURIComponent(`Ajuda a encontrar ${dogName}!`)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  const copyUrl = () => {
    navigator.clipboard?.writeText(caseUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {})
  }

  const buttons = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <Btn size="md" variant="ghost" icon={<Icon name="facebook" size={14} />} full onClick={() => share('facebook')}>Facebook</Btn>
      <Btn size="md" variant="ghost" icon={<Icon name="whatsapp" size={14} />} full onClick={() => share('whatsapp')}>WhatsApp</Btn>
      <Btn size="md" variant="ghost" icon={<Icon name="telegram" size={14} />} full onClick={() => share('telegram')}>Telegram</Btn>
    </div>
  )

  if (compact) return buttons

  return (
    <div style={{ padding: 20, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
      <h3 style={{ margin: 0, fontFamily: N.display, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em' }}>
        Partilha em 30 segundos.
      </h3>
      <p style={{ margin: '4px 0 14px', fontSize: 13, color: N.ink2, lineHeight: 1.45 }}>
        Cada partilha aumenta a probabilidade de {dogName} voltar a casa.
      </p>
      {buttons}
      {fbCopied && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: N.ink2, lineHeight: 1.45, background: N.surface, padding: '8px 10px', borderRadius: 8 }}>
          ✓ Texto copiado — cola na publicação do Facebook (o Facebook não deixa preencher o texto automaticamente).
        </p>
      )}
      <div style={{ marginTop: 14 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: N.ink3, lineHeight: 1.4 }}>
          Ou partilha este link em qualquer lado:
        </p>
        <div style={{ padding: '9px 12px', borderRadius: 8, background: N.surface, fontFamily: N.mono, fontSize: 11.5, color: N.ink2, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortUrl}</span>
          <button onClick={copyUrl} style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
            {copied ? 'copiado ✓' : 'copiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
