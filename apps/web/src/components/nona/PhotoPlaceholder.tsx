import React from 'react'
import { N } from './tokens'

type Tone = 'cocoa' | 'sand' | 'rose' | 'moss' | 'slate' | 'cream' | 'midnight'

const TONES: Record<Tone, [string, string]> = {
  cocoa:    ['#a08a73', '#5e4d3e'],
  sand:     ['#cfb898', '#8f7a5e'],
  rose:     ['#c39684', '#8a5746'],
  moss:     ['#9ba78a', '#5e6c52'],
  slate:    ['#9c9d9e', '#5d5e60'],
  cream:    ['#dccfb9', '#b1a283'],
  midnight: ['#3e3a36', '#0f0e0c'],
}

interface PhotoPlaceholderProps {
  tone?: Tone
  label?: string
  sub?: string
  ratio?: string
  w?: string | number
  h?: string | number
  radius?: number
  style?: React.CSSProperties
}

export function PhotoPlaceholder({
  tone = 'cocoa', label, sub, ratio, w, h, radius = 0, style = {},
}: PhotoPlaceholderProps) {
  const [a, b] = TONES[tone] ?? TONES.cocoa
  const dims: React.CSSProperties = ratio
    ? { width: w ?? '100%', aspectRatio: ratio }
    : { width: w ?? '100%', height: h ?? '100%' }
  return (
    <div style={{
      ...dims, borderRadius: radius, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.18) 0%, transparent 50%),
                     repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 22px, rgba(0,0,0,0.025) 22px 44px)`,
      }}/>
      {label && (
        <div style={{
          position: 'absolute', left: 10, bottom: 8, right: 10,
          fontFamily: N.mono, fontSize: 9.5, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between', gap: 8,
        }}>
          <span>{label}</span>
          {sub && <span style={{ opacity: 0.7 }}>{sub}</span>}
        </div>
      )}
    </div>
  )
}
