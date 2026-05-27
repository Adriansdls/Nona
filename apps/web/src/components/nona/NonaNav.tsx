import React from 'react'
import Link from 'next/link'
import { N } from './tokens'
import { Logo } from './Logo'

type NavPage = 'casos' | 'como' | 'comm' | 'api'

interface NonaNavProps {
  on?: NavPage
  locale?: string
}

export function NonaNav({ on, locale = 'pt' }: NonaNavProps) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px', background: N.paper,
      borderBottom: `1px solid ${N.rule}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href={`/${locale}`} style={{ textDecoration: 'none' }}>
          <Logo size={18}/>
        </Link>
        <nav style={{ display: 'flex', gap: 22 }}>
          {([
            { k: 'casos' as NavPage, label: 'Casos',          href: `/${locale}/casos` },
            { k: 'como'  as NavPage, label: 'Como funciona',  href: '#como' },
            { k: 'comm'  as NavPage, label: 'Comunidade',     href: '#comunidade' },
          ] as const).map(item => (
            <Link
              key={item.k}
              href={item.href}
              style={{
                fontSize: 13, color: on === item.k ? N.ink : N.ink3,
                textDecoration: 'none', fontWeight: on === item.k ? 600 : 500,
                fontFamily: N.sans,
              }}
            >
              {item.label}
            </Link>
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
  )
}
