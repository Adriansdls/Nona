'use client'
import React from 'react'
import { N } from './tokens'

type BtnVariant = 'primary' | 'soft' | 'ghost' | 'text'
type BtnSize = 'sm' | 'md' | 'lg'
type BtnTone = 'ink' | 'indigo' | 'rose' | 'emerald'

const SIZES = {
  sm: { p: '6px 11px',  fs: 13,   h: 32, r: 8 },
  md: { p: '9px 14px',  fs: 13.5, h: 38, r: 9 },
  lg: { p: '13px 20px', fs: 15,   h: 48, r: 11 },
}

interface BtnProps {
  variant?: BtnVariant
  size?: BtnSize
  tone?: BtnTone
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  children?: React.ReactNode
  full?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export function Btn({
  variant = 'primary', size = 'md', tone = 'ink',
  icon, iconRight, children, full, onClick, style = {}, type = 'button', disabled,
}: BtnProps) {
  const toneFg = { ink: N.ink, indigo: N.indigo, rose: N.rose, emerald: N.emerald }[tone]
  const sz = SIZES[size]
  const v = {
    primary: { bg: toneFg, fg: 'white', bd: `1px solid ${toneFg}` },
    soft:    { bg: tone === 'indigo' ? N.indigoBg : tone === 'rose' ? N.roseBg : N.surface, fg: toneFg, bd: '1px solid transparent' },
    ghost:   { bg: N.white, fg: N.ink, bd: `1px solid ${N.rule}` },
    text:    { bg: 'transparent', fg: toneFg, bd: '1px solid transparent' },
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        padding: sz.p, height: sz.h, minHeight: sz.h, width: full ? '100%' : 'auto',
        borderRadius: sz.r, border: v.bd, background: v.bg, color: v.fg,
        fontSize: sz.fs, fontWeight: 500, letterSpacing: '-0.005em',
        transition: 'transform .08s ease, opacity .15s ease',
        whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: N.sans,
        ...style,
      }}
    >
      {icon}{children}{iconRight}
    </button>
  )
}
