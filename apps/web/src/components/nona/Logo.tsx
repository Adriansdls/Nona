import React from 'react'
import { N } from './tokens'

interface LogoProps {
  size?: number
  color?: string
  withMark?: boolean
}

export function Logo({ size = 18, color, withMark = true }: LogoProps) {
  const c = color ?? N.ink
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.4,
      fontFamily: N.display, fontWeight: 400, fontSize: size * 1.15,
      letterSpacing: '-0.025em', color: c, lineHeight: 1,
    }}>
      {withMark && (
        <span style={{
          width: size * 0.9, height: size * 0.9, borderRadius: 6,
          background: c, position: 'relative', display: 'inline-block',
        }}>
          <span style={{
            position: 'absolute', inset: '24%', display: 'block',
            background: `linear-gradient(90deg, transparent 43%, ${N.paper} 43%, ${N.paper} 57%, transparent 57%),
                         linear-gradient(0deg,  transparent 43%, ${N.paper} 43%, ${N.paper} 57%, transparent 57%)`,
          }}/>
        </span>
      )}
      <span>nona</span>
    </span>
  )
}
