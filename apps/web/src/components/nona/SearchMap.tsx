import React from 'react'
import { N } from './tokens'

const MAP_BG     = '#F4F0E8'
const MAP_PARK   = '#D6E8C6'
const MAP_WATER  = '#C6DCE8'
const ROAD_MINOR = '#FFFFFF'
const ROAD_MAJOR = '#FFDFAF'
const ROAD_HWY   = '#FFC960'
const TEXT       = '#5C5650'
const TEXT_LIGHT = '#8C8680'

interface MapPinProps {
  x: string
  y: string
  kind?: 'origin' | 'sight'
  label: string
  sub?: string | undefined
  fresh?: boolean | undefined
  pulsing?: boolean | undefined
}

function MapPin({ x, y, kind = 'sight', label, sub, fresh, pulsing }: MapPinProps) {
  const color = kind === 'origin' ? N.rose : N.amber
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        background: N.ink, color: N.paper, padding: '4px 9px', borderRadius: 6,
        fontSize: 11, fontWeight: 500, lineHeight: 1.3, whiteSpace: 'nowrap', position: 'relative',
        boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
      }}>
        <div>{label}</div>
        {sub && <div style={{ fontSize: 9.5, color: N.ink4, fontFamily: N.mono, marginTop: 1 }}>{sub}</div>}
        <span style={{
          position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
          width: 5, height: 5, background: N.ink,
        }}/>
      </div>
      <div style={{ position: 'relative', marginTop: 4 }}>
        {(fresh ?? pulsing) && (
          <span style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: `2px solid ${color}`, animation: 'nn-ping 2s cubic-bezier(0,0,.2,1) infinite',
          }}/>
        )}
        <svg width="24" height="28" viewBox="0 0 28 32">
          <path d="M14 0 A 12 12 0 0 1 26 12 C 26 22 14 32 14 32 C 14 32 2 22 2 12 A 12 12 0 0 1 14 0 Z" fill={color} stroke="white" strokeWidth="2"/>
          <circle cx="14" cy="12" r="4" fill="white"/>
        </svg>
      </div>
    </div>
  )
}

interface MapRiskProps { x: string; y: string; icon: string; label: string }
function MapRisk({ x, y, icon, label }: MapRiskProps) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 18, height: 18, borderRadius: 4, background: '#1f2937', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>{icon}</span>
      <span style={{ background: 'rgba(255,255,255,0.94)', padding: '3px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 500, color: '#1f2937', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.10)' }}>{label}</span>
    </div>
  )
}

interface MapCheckProps { x: string; y: string; label: string }
function MapCheck({ x, y, label }: MapCheckProps) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: N.emerald, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}/>
      <span style={{ background: 'rgba(255,255,255,0.92)', padding: '2px 7px', borderRadius: 4, fontSize: 10, color: N.emeraldDeep, whiteSpace: 'nowrap', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

interface LegendItemProps { dot?: string; ring?: string; label: string }
function LegendItem({ dot, ring, label }: LegendItemProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      {ring
        ? <span style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px dashed ${ring}` }}/>
        : <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }}/>}
      <span>{label}</span>
    </span>
  )
}

interface SearchMapProps {
  height?: number
  lastSeenLabel?: string
  sightings?: Array<{ label: string; sub?: string; x: string; y: string; fresh?: boolean }>
}

export function SearchMap({ height = 380, lastSeenLabel = 'Última vez visto', sightings }: SearchMapProps) {
  const defaultSightings = sightings ?? [
    { label: 'Av. 5 de Outubro', sub: 'credibilidade média', x: '50%', y: '48%' },
    { label: 'Estação · zona', sub: 'credibilidade alta', x: '63%', y: '68%' },
    { label: 'Estação · recente', sub: 'há 1 min', x: '72%', y: '65%', fresh: true },
  ]
  return (
    <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden', background: MAP_BG }}>
      <svg viewBox="0 0 1200 480" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M 80 60 Q 180 40 240 80 L 280 180 Q 200 220 100 200 Z" fill={MAP_PARK} opacity="0.7"/>
        <path d="M 920 320 Q 1020 300 1100 360 L 1140 460 L 940 460 Z" fill={MAP_PARK} opacity="0.55"/>
        <rect x="540" y="380" width="160" height="80" rx="6" fill={MAP_PARK} opacity="0.55"/>
        <path d="M -20 380 Q 200 360 420 400 T 820 380 T 1240 400 L 1240 540 L -20 540 Z" fill={MAP_WATER} opacity="0.85"/>
        {([
          [120,240,60,40],[200,250,80,50],[320,230,70,60],[450,230,90,50],[580,220,60,60],
          [680,240,80,50],[820,220,90,55],[940,230,60,60],[1040,220,80,50],
          [120,100,50,30],[380,90,60,40],[500,110,50,30],[720,100,70,40],[880,90,60,45],[1000,110,50,30],
        ] as [number,number,number,number][]).map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="#E8DFCE" opacity="0.65"/>
        ))}
        <path d="M -20 200 Q 320 220 600 200 T 1240 220" stroke={ROAD_HWY} strokeWidth="14" fill="none" strokeLinecap="round"/>
        <path d="M 600 -20 L 580 200 L 620 460" stroke={ROAD_MAJOR} strokeWidth="10" fill="none"/>
        <path d="M -20 320 Q 400 310 800 330 T 1240 310" stroke={ROAD_MAJOR} strokeWidth="9" fill="none"/>
        {(['M 220 -20 L 240 540','M 360 -20 L 380 540','M 760 -20 L 740 540','M -20 80 L 1240 90','M -20 280 L 1240 290'] as const).map((d,i) => <path key={i} d={d} stroke={ROAD_MINOR} strokeWidth="4" fill="none"/>)}
        <path d="M -20 360 Q 300 370 600 355 T 1240 355" stroke="#1f2937" strokeWidth="2.5" fill="none"/>
        <path d="M -20 360 Q 300 370 600 355 T 1240 355" stroke="#9ca3af" strokeWidth="2.5" fill="none" strokeDasharray="2 6"/>
        <text x="640" y="195" fontSize="11" fill={TEXT} fontFamily="Inter Tight, sans-serif" fontWeight="500">N125 — EN125</text>
        <text x="150" y="312" fontSize="10" fill={TEXT_LIGHT} fontFamily="Inter Tight, sans-serif">R. de Santo António</text>
        <text x="200" y="100" fontSize="10" fill={TEXT_LIGHT} fontFamily="Inter Tight, sans-serif">Parque da Alagoa</text>
        <text x="950" y="430" fontSize="11" fill="#5A7C9A" fontFamily="Inter Tight, sans-serif" fontStyle="italic">Ria Formosa</text>
        <text x="380" y="240" fontSize="11" fill={TEXT} fontFamily="Inter Tight, sans-serif">Centro · Faro</text>
        <text x="660" y="350" fontSize="9" fill="#374151" fontFamily="Inter Tight, sans-serif" fontWeight="500" letterSpacing=".05em">LINHA DO COMBOIO</text>
        <circle cx="380" cy="265" r="120" fill={N.rose} opacity="0.10" stroke={N.rose} strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="3 4"/>
        <circle cx="380" cy="265" r="220" fill={N.amber} opacity="0.06" stroke={N.amber} strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 4"/>
        <circle cx="380" cy="265" r="330" fill={N.ink3} opacity="0.03" stroke={N.ink3} strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 5"/>
        <text x="380" y="155" fontSize="9.5" fill={N.roseDeep} fontFamily="JetBrains Mono, monospace" fontWeight="500" letterSpacing=".12em" textAnchor="middle">ZONA QUENTE · 0–1h</text>
        <text x="380" y="80"  fontSize="9.5" fill={N.amber}    fontFamily="JetBrains Mono, monospace" fontWeight="500" letterSpacing=".12em" textAnchor="middle">ZONA MORNA · 1–3h</text>
      </svg>
      <MapPin x="31.5%" y="55%" kind="origin" label={lastSeenLabel} sub="17:00" pulsing/>
      {defaultSightings.map((s, i) => (
        <MapPin key={i} x={s.x} y={s.y} kind="sight" label={s.label} sub={s.sub} fresh={s.fresh}/>
      ))}
      <MapRisk x="60%" y="42%" icon="!" label="EN125 · trânsito intenso"/>
      <MapRisk x="55%" y="74%" icon="~" label="Linha do comboio"/>
      <MapCheck x="13%" y="22%" label="Parque da Alagoa"/>
      <MapCheck x="48%" y="86%" label="Mercado Municipal"/>
      <MapCheck x="68%" y="68%" label="Estação"/>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['+','−','⌖'].map(c => (
          <button key={c} style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            border: 'none', color: N.ink, fontSize: 14, fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderRadius: 8, padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'grid', gridTemplateColumns: 'auto auto auto', columnGap: 14, rowGap: 4,
        fontSize: 10.5, color: N.ink2,
      }}>
        <LegendItem dot={N.rose}    label="última vez visto"/>
        <LegendItem dot={N.amber}   label="avistamento"/>
        <LegendItem dot="#1f2937"   label="risco"/>
        <LegendItem ring={N.rose}   label="zona quente"/>
        <LegendItem ring={N.amber}  label="zona morna"/>
        <LegendItem dot={N.emerald} label="verificar"/>
      </div>
    </div>
  )
}
