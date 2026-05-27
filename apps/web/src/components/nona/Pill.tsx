import React from 'react'
import { N } from './tokens'

type PillKind = 'active' | 'lost' | 'found' | 'resolved' | 'live' | 'indigo' | 'ghost'
type PillSize = 'xs' | 'sm' | 'md'

interface PillConfig {
  bg: string
  fg: string
  label: string
  border?: string
}

const CONFIGS: Record<PillKind, PillConfig> = {
  active:   { bg: N.roseBg,    fg: N.roseDeep,    label: 'ATIVO' },
  lost:     { bg: N.roseBg,    fg: N.roseDeep,    label: 'PERDIDO' },
  found:    { bg: N.emeraldBg, fg: N.emeraldDeep, label: 'ENCONTRADO' },
  resolved: { bg: N.emeraldBg, fg: N.emeraldDeep, label: 'REUNIDO' },
  live:     { bg: N.amberBg,   fg: N.amber,       label: 'LIVE' },
  indigo:   { bg: N.indigoBg,  fg: N.indigoDeep,  label: '' },
  ghost:    { bg: 'transparent', fg: N.ink3, label: '', border: `1px solid ${N.rule}` },
}

const SIZES = {
  xs: { p: '2px 7px',  fs: 10,   dot: 5, gap: 5 },
  sm: { p: '3px 9px',  fs: 10.5, dot: 5, gap: 6 },
  md: { p: '5px 11px', fs: 11.5, dot: 6, gap: 7 },
}

interface PillProps {
  kind?: PillKind
  children?: React.ReactNode
  dot?: boolean
  size?: PillSize
  mono?: boolean
  style?: React.CSSProperties
}

export function Pill({ kind = 'active', children, dot = true, size = 'sm', mono = true, style = {} }: PillProps) {
  const cfg = CONFIGS[kind]
  const sz = SIZES[size]
  const pulsing = ['live', 'active', 'lost'].includes(kind)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: sz.gap,
      padding: sz.p, borderRadius: 999,
      background: cfg.bg, color: cfg.fg, border: cfg.border,
      fontFamily: mono ? N.mono : N.sans, fontSize: sz.fs, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, ...style,
    }}>
      {dot && (
        <span style={{
          width: sz.dot, height: sz.dot, borderRadius: '50%', background: cfg.fg, flexShrink: 0,
          animation: pulsing ? 'nn-pulse 1.8s ease-in-out infinite' : 'none',
        }}/>
      )}
      {children ?? cfg.label}
    </span>
  )
}
