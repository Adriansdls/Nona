'use client'
import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { N } from '@/components/nona/tokens'
import { NonaNav } from '@/components/nona/NonaNav'
import { Icon } from '@/components/nona/Icon'
import { Pill } from '@/components/nona/Pill'
import { Btn } from '@/components/nona/Btn'
import { PhotoPlaceholder } from '@/components/nona/PhotoPlaceholder'
import { AgentFeed, LIFETIME_EVENTS, type AgentEvent } from '@/components/nona/AgentFeed'
import { QRTile } from '@/components/nona/QRTile'
import { MUNICIPALITY_CENTROIDS } from '@/lib/geo/geocode'
import type { SearchIntel, IntelZone, IntelHazard, InsufficientData } from '@/app/api/cases/[slug]/intel/route'

const SearchMap = dynamic(
  () => import('@/components/nona/SearchMap').then((m) => ({ default: m.SearchMap })),
  { ssr: false, loading: () => <div style={{ width: '100%', height: 380, background: '#F4F0E8', borderRadius: 14 }} /> },
)

function parsePoint(raw: string | null | undefined): { lat: number; lng: number } | null {
  if (!raw) return null
  const m = raw.match(/\(([^,]+),([^)]+)\)/)
  if (!m) return null
  // stored as (lng,lat) per geocode.ts write pattern
  return { lng: parseFloat(m[1]!), lat: parseFloat(m[2]!) }
}

// ─── Sub-components ─────────────────────────────────────────────────
function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '10px 0', borderBottom: `1px solid ${N.ruleSoft}`, fontSize: 13.5, lineHeight: 1.4 }}>
      <span style={{ color: N.ink3, fontFamily: N.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ color: N.ink, fontWeight: 500, fontFamily: mono ? N.mono : N.sans }}>{value}</span>
    </div>
  )
}

function LiveStat({ icon, n, label, sub, accent = N.ink3, pulsing }: {
  icon: string; n: string; label: string; sub?: string; accent?: string; pulsing?: boolean
}) {
  return (
    <div style={{ padding: '14px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12, position: 'relative' }}>
      {pulsing && (
        <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: accent, animation: 'nn-pulse 1.6s ease-in-out infinite' }}/>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon as Parameters<typeof Icon>[0]['name']} size={13} color={accent}/>
        <span style={{ fontFamily: N.mono, fontSize: 10.5, color: N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ marginTop: 6, fontFamily: N.display, fontSize: 36, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1, color: N.ink }} className="tabnum">
        {n}
      </div>
      {sub && <div style={{ marginTop: 4, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>{sub}</div>}
    </div>
  )
}

const ZONE_COLORS: Record<string, string> = { rose: N.rose, amber: N.amber, blue: N.indigo }

function ZoneCard({ title, ring, radius_km, instruct, checkpoints, evidence }: {
  title: string; ring: string; radius_km: number; instruct: string; checkpoints: string[];
  evidence: IntelZone['evidence']
}) {
  return (
    <div style={{ padding: '14px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px dashed ${ring}`, flexShrink: 0, marginTop: 4 }}/>
        <span style={{ fontFamily: N.display, fontSize: 17, fontWeight: 400, letterSpacing: '-0.015em', flex: 1 }}>{title}</span>
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>{radius_km} km</span>
      </div>
      <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>{instruct}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {checkpoints.map(cp => (
          <span key={cp} style={{ padding: '3px 8px', borderRadius: 6, background: N.surface, fontFamily: N.mono, fontSize: 10.5, color: N.ink2 }}>{cp}</span>
        ))}
      </div>
      {evidence.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {evidence.map((e, i) => (
            e.url
              ? <a key={i} href={e.url} target="_blank" rel="noopener noreferrer" title={e.detail} style={{ fontFamily: N.mono, fontSize: 9.5, color: N.ink3, textDecoration: 'none', padding: '2px 5px', borderRadius: 4, background: N.surface, border: `1px solid ${N.rule}` }}>{e.source}</a>
              : <span key={i} title={e.detail} style={{ fontFamily: N.mono, fontSize: 9.5, color: N.ink3, padding: '2px 5px', borderRadius: 4, background: N.surface, border: `1px solid ${N.rule}` }}>{e.source}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ZoneCardSkeleton() {
  return (
    <div style={{ padding: '14px 16px', background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: N.surface }}/>
        <div style={{ height: 14, width: 100, borderRadius: 4, background: N.surface }}/>
        <div style={{ marginLeft: 'auto', height: 11, width: 60, borderRadius: 4, background: N.surface }}/>
      </div>
      <div style={{ height: 11, width: '90%', borderRadius: 4, background: N.surface, marginBottom: 6 }}/>
      <div style={{ height: 11, width: '70%', borderRadius: 4, background: N.surface, marginBottom: 10 }}/>
      <div style={{ display: 'flex', gap: 5 }}>
        {[80, 60, 90].map(w => <div key={w} style={{ height: 22, width: w, borderRadius: 6, background: N.surface }}/>)}
      </div>
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────
interface GeoRow {
  municipality: string
  zone_type: string
  a22_side: string
  terrain_permeability: string
  water_source_type: string
  food_availability: string
  human_density: string
  tourist_peak_months: number[]
  goatherd_zone: boolean
  fire_risk_band: string
  search_radius_modifier: number
  water_points?: Array<{ name: string; type?: string; lat: number; lng: number }>
  terrain_corridors?: Array<{ name: string; type?: string; description?: string }>
}

interface ProbabilityScenario {
  title: string
  probability: number
  reasoning?: string
  actions: string[]
}

interface ActionGate {
  broadcast_sighting_location?: 'public' | 'private_coordinator_only' | 'blocked'
  active_search_permitted?: boolean
  crowd_response_blocked?: boolean
  name_calling_blocked?: boolean
  drone_blocked?: boolean
  gate_rationale?: string
  conditioning_events?: string[]
}

interface PhaseState {
  current?: string
  phase_1_cap_hours?: number
  last_calculated_at?: string
}

interface BehavioralProfile {
  sociability?: string
  environment?: string
  stress_level?: string
  breed_category?: string
  escape_trigger?: string
  temperament?: string
  scenarios?: ProbabilityScenario[]
  phase_state?: PhaseState
  action_gate?: ActionGate
}

// ─── Props ───────────────────────────────────────────────────────────
interface CaseImage {
  id: string
  public_url: string | null
  is_primary: boolean
  quality_score: number | null
}

interface SightingRow {
  id: string
  seen_at: string
  zone_approx: string
  coords_approx: string | null
  description: string | null
  is_public: boolean
}

interface CaseRow {
  id: string
  slug: string
  type: string
  status: string
  dog_name: string | null
  breed: string
  sex: string
  size: string
  primary_color: string
  secondary_color: string | null
  distinctive_marks: string[] | null
  age_estimate: string | null
  has_chip: boolean | null
  chip_last_3: string | null
  last_seen_at: string
  last_seen_municipality: string
  last_seen_zone_approx: string
  last_seen_coords_approx: string | null
  description: string
  context: string | null
  reporter_contact_public: string | null
  created_at: string
  resolved_at: string | null
  behavioral_profile?: BehavioralProfile | null
  case_images: CaseImage[]
}

interface CasePageClientProps {
  locale: string
  data: {
    case: CaseRow
    sightings: SightingRow[]
    stats: { publicSightings: number; totalSightings: number }
    geo: GeoRow | null
  }
}

export function CasePageClient({ locale, data }: CasePageClientProps) {
  const { case: c, sightings, stats, geo } = data
  const [selectedImg, setSelectedImg] = useState(0)
  const [copied, setCopied] = useState(false)
  const [intel, setIntel] = useState<SearchIntel | null>(null)
  const [intelInsufficient, setIntelInsufficient] = useState<InsufficientData | null>(null)

  useEffect(() => {
    fetch(`/api/cases/${c.slug}/intel`)
      .then((r) => r.json())
      .then((body: { data: SearchIntel | InsufficientData }) => {
        if ('what_was_tried' in body.data) {
          setIntelInsufficient(body.data as InsufficientData)
        } else {
          setIntel(body.data as SearchIntel)
        }
      })
      .catch(() => {})
  }, [c.slug])

  const images = c.case_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  const primaryImg = images[0]
  const dogName = c.dog_name ?? c.breed

  const kindPill = c.type === 'perdido' ? 'lost' : 'found'
  const statusPill = c.status === 'resolvido' ? 'resolved' : kindPill

  const chipDisplay = c.has_chip && c.chip_last_3 ? `·· ·· ${c.chip_last_3}` : c.has_chip ? '· com chip' : null

  const caseUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://nona.pt'}/${locale}/caso/${c.slug}`
  const shortUrl = `nona.pt/caso/${c.slug}`

  const msSinceCreated = Date.now() - new Date(c.created_at).getTime()
  const hoursOpen = Math.floor(msSinceCreated / 3600000)
  const openLabel = hoursOpen < 1 ? 'há menos de 1h' : hoursOpen === 1 ? 'há 1h' : `há ${hoursOpen}h`

  // Build activity events from real sightings
  const activityEvents: AgentEvent[] = [
    ...sightings.map(s => ({
      t: new Date(s.seen_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      kind: 'sighting' as const,
      label: 'Avistamento confirmado',
      detail: `${s.zone_approx}${s.description ? ' · ' + s.description.slice(0, 60) : ''}`,
      fresh: Date.now() - new Date(s.seen_at).getTime() < 3600000,
    })),
    ...LIFETIME_EVENTS.slice(sightings.length),
  ]

  const copyUrl = () => {
    navigator.clipboard.writeText(caseUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const share = (platform: string) => {
    const text = encodeURIComponent(`Ajuda a encontrar ${dogName}! ${caseUrl}`)
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(caseUrl)}`,
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(caseUrl)}&text=${encodeURIComponent(`Ajuda a encontrar ${dogName}!`)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100vh' }}>
      <NonaNav on="casos" locale={locale}/>

      {/* breadcrumb */}
      <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: N.mono, fontSize: 11.5, color: N.ink3, background: N.paper, borderBottom: `1px solid ${N.rule}` }}>
        <Link href={`/${locale}/casos`} style={{ color: N.ink3, textDecoration: 'none' }}>casos</Link>
        <span>/</span>
        <Link href={`/${locale}/casos?municipality=${c.last_seen_municipality}`} style={{ color: N.ink3, textDecoration: 'none' }}>
          algarve · {c.last_seen_municipality.toLowerCase()}
        </Link>
        <span>/</span>
        <span style={{ color: N.ink }}>{c.slug}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10, alignItems: 'center' }}>
          <Pill kind={statusPill} size="xs"/>
          <span style={{ color: N.ink3 }}>aberto {openLabel}</span>
        </span>
      </div>

      {/* HERO — photo + meta */}
      <section style={{ padding: '32px 32px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
        <div>
          {primaryImg?.public_url ? (
            <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3' }}>
              <img
                src={images[selectedImg]?.public_url ?? primaryImg.public_url}
                alt={dogName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <PhotoPlaceholder tone="cocoa" label={dogName} radius={14} ratio="4/3"/>
          )}
          {images.length > 1 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              {images.slice(0, 3).map((img, i) => (
                <div key={img.id} style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedImg(i)}>
                  {img.public_url ? (
                    <div style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', outline: i === selectedImg ? `2px solid ${N.ink}` : 'none', outlineOffset: 2 }}>
                      <img src={img.public_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    </div>
                  ) : (
                    <PhotoPlaceholder tone="sand" radius={8} ratio="4/3" style={{ outline: i === selectedImg ? `2px solid ${N.ink}` : 'none', outlineOffset: 2 }}/>
                  )}
                </div>
              ))}
              <div style={{ flex: 1, borderRadius: 8, border: `1px dashed ${N.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: N.ink3, fontFamily: N.mono, fontSize: 11, aspectRatio: '4/3' }}>
                + avistamento
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Pill kind={kindPill} size="sm"/>
            {stats.totalSightings > 0 && (
              <Pill kind="ghost" size="sm" dot={false}>visto {stats.totalSightings}× aprox.</Pill>
            )}
          </div>
          <h1 style={{ margin: 0, fontFamily: N.display, fontSize: 104, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 0.9, color: N.ink } as React.CSSProperties}>
            {dogName}
          </h1>
          <p style={{ margin: '-6px 0 0', fontFamily: N.display, fontStyle: 'italic', fontSize: 22, color: N.ink2, letterSpacing: '-0.01em' }}>
            {[c.breed, c.sex, c.age_estimate].filter(Boolean).join(' · ')}
          </p>

          <div style={{ borderTop: `1px solid ${N.rule}`, borderBottom: `1px solid ${N.rule}`, marginTop: 4 }}>
            <MetaRow label="Última vez" value={`${c.last_seen_municipality} · ${c.last_seen_zone_approx}`}/>
            <MetaRow label="Quando" value={new Date(c.last_seen_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} mono/>
            <MetaRow label="Cor" value={[c.primary_color, c.secondary_color].filter(Boolean).join(', ')}/>
            {c.distinctive_marks && c.distinctive_marks.length > 0 && (
              <MetaRow label="Marcas" value={c.distinctive_marks.join(' · ')}/>
            )}
            {chipDisplay && <MetaRow label="Chip" value={chipDisplay} mono/>}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={`/${locale}/caso/${c.slug}/avistamento`} style={{ textDecoration: 'none' }}>
              <Btn size="lg" variant="primary" tone="ink" icon={<Icon name="eye" size={16} color={N.paper}/>}>Vi o {dogName}</Btn>
            </Link>
            <Btn size="lg" variant="ghost" icon={<Icon name="shareUp" size={15}/>} onClick={() => share('whatsapp')}>Partilhar</Btn>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, color: N.ink3, lineHeight: 1.5 }}>
            O contacto do proprietário não é público. Toda a comunicação passa pela equipa Nona.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '8px 32px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <LiveStat icon="eye" n={String(stats.publicSightings)} label="avistamentos" sub={stats.publicSightings > 0 ? `${stats.publicSightings} confirmados` : 'nenhum ainda'} accent={stats.publicSightings > 0 ? N.amber : N.ink3} pulsing={stats.publicSightings > 0}/>
          <LiveStat icon="clock" n={openLabel.replace('há ','')} label="aberto" sub="caso activo"/>
          <LiveStat icon="share" n="0" label="partilhas" sub="aguardando"/>
          <LiveStat icon="users" n="0" label="voluntários" sub="zona activa"/>
          <LiveStat icon="trending" n="0" label="visitas" sub="hoje"/>
        </div>
      </section>

      {/* SEARCH MAP + INTEL */}
      <section style={{ padding: '12px 32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
            Onde procurar.
          </h2>
          <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, display: 'flex', alignItems: 'center', gap: 6 }}>
            {!intel && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: N.amber, animation: 'nn-pulse 1.2s ease-in-out infinite' }}/>}
            {intel ? 'análise IA · terreno e avistamentos' : 'a calcular zonas…'}
          </span>
        </div>

        {/* Brief panel — shown when intel loads */}
        {intel?.brief && (
          <div style={{ marginBottom: 14, padding: '12px 16px', background: N.indigoBg, border: `1px solid ${N.indigo}33`, borderRadius: 12, fontSize: 13.5, color: N.indigoDeep, lineHeight: 1.55 }}>
            {intel.brief}
          </div>
        )}

        {/* Movement analysis — shown when 2+ sightings enable triangulation */}
        {intel?.movement && (
          <div style={{ marginBottom: 14, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, fontSize: 13, color: '#15803d', lineHeight: 1.55 }}>
            <strong style={{ fontFamily: N.mono, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Análise de movimento</strong>
            <span style={{ fontWeight: 600 }}>{intel.movement.direction}</span>
            {intel.movement.speed_estimate && <span style={{ color: '#166534', marginLeft: 6 }}>· {intel.movement.speed_estimate}</span>}
            <div style={{ marginTop: 4 }}>{intel.movement.pattern}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'stretch' }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${N.rule}` }}>
            <SearchMap
              height={380}
              center={parsePoint(c.last_seen_coords_approx) ?? MUNICIPALITY_CENTROIDS[c.last_seen_municipality] ?? { lat: 37.0194, lng: -7.9304 }}
              lastSeenLabel={c.last_seen_zone_approx || 'Última vez visto'}
              sightings={sightings.flatMap((s) => {
                const coords = parsePoint(s.coords_approx)
                if (!coords) return []
                return [{
                  lat: coords.lat,
                  lng: coords.lng,
                  label: s.zone_approx,
                  sub: new Date(s.seen_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                  fresh: Date.now() - new Date(s.seen_at).getTime() < 3600000,
                }]
              })}
              zones={intel?.zones?.map(z => ({ radius_km: z.radius_km, color: z.color })) ?? []}
              waterPoints={(geo?.water_points ?? []).filter(w => typeof w.lat === 'number' && typeof w.lng === 'number')}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Confidence badge + behavioral phase */}
            {intel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: N.mono, fontSize: 10.5, color: intel.confidence === 'high' ? '#16a34a' : intel.confidence === 'medium' ? '#d97706' : N.ink3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }}/>
                  confiança {intel.confidence === 'high' ? 'alta' : intel.confidence === 'medium' ? 'média' : 'baixa'}
                </div>
                {intel.behavioral_phase && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: N.mono, fontSize: 10.5, color: intel.behavioral_phase === 'panic' ? '#dc2626' : intel.behavioral_phase === 'survival' ? '#d97706' : N.ink3 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }}/>
                    fase {intel.behavioral_phase === 'panic' ? 'pânico · 0-24h' : intel.behavioral_phase === 'survival' ? 'sobrevivência · 24h-7d' : 'recuperação · 7d+'}
                  </div>
                )}
              </div>
            )}

            {/* Insufficient data state */}
            {intelInsufficient && !intel && (
              <div style={{ padding: '14px 16px', background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
                <p style={{ margin: '0 0 6px', fontFamily: N.mono, fontSize: 10.5, color: N.ink3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>dados insuficientes</p>
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>{intelInsufficient.reason}</p>
                {intelInsufficient.partial_context && (
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: N.ink2, lineHeight: 1.4 }}>{intelInsufficient.partial_context}</p>
                )}
              </div>
            )}

            {/* Zone cards */}
            {(intel ? intel.zones : []).map((z: IntelZone) => (
              <ZoneCard
                key={z.title}
                title={z.title}
                ring={ZONE_COLORS[z.color] ?? N.amber}
                radius_km={z.radius_km}
                instruct={z.instruction}
                checkpoints={z.checkpoints}
                evidence={z.evidence ?? []}
              />
            ))}
            {!intel && !intelInsufficient && [1, 2].map(i => <ZoneCardSkeleton key={i} />)}

            {/* Warnings */}
            {intel && intel.warnings?.length > 0 && (
              <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                {intel.warnings.map((w: string, i: number) => (
                  <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0, fontSize: 12, color: '#b91c1c', lineHeight: 1.45 }}>{w}</p>
                ))}
              </div>
            )}

            {/* Hazards panel */}
            <div style={{ padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, background: '#1f2937', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: N.mono, fontSize: 10, fontWeight: 700 }}>!</span>
                <span style={{ fontFamily: N.display, fontSize: 17, fontWeight: 400, letterSpacing: '-0.015em' }}>Riscos imediatos</span>
              </div>
              {intel
                ? intel.hazards.length === 0
                  ? <p style={{ margin: 0, fontSize: 12, color: N.ink3 }}>Sem riscos imediatos identificados nesta área.</p>
                  : (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
                      {intel.hazards.map((h: IntelHazard, i: number) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
                          <span>
                            <span style={{ color: h.severity === 'critical' ? '#dc2626' : N.ink, fontWeight: 500 }}>{h.label}</span>
                            <span style={{ color: N.ink3 }}> · {h.note}</span>
                          </span>
                          {h.evidence?.url
                            ? <a href={h.evidence.url} target="_blank" rel="noopener noreferrer" title={h.evidence.detail} style={{ flexShrink: 0, fontFamily: N.mono, fontSize: 9, color: N.ink3, textDecoration: 'none', padding: '1px 4px', borderRadius: 3, background: N.surface, border: `1px solid ${N.rule}` }}>{h.severity}</a>
                            : <span style={{ flexShrink: 0, fontFamily: N.mono, fontSize: 9.5, color: h.severity === 'critical' ? '#dc2626' : h.severity === 'high' ? '#d97706' : N.ink3 }}>{h.severity}</span>
                          }
                        </li>
                      ))}
                    </ul>
                  )
                : (
                  <div style={{ display: 'grid', gap: 5 }}>
                    {[1, 2].map(i => (
                      <div key={i} style={{ height: 14, borderRadius: 4, background: '#fed7aa' }}/>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </section>

      {/* ACTION GATE WARNINGS (WP9) — shown before scenarios */}
      {c.behavioral_profile?.action_gate && (
        (() => {
          const ag = c.behavioral_profile!.action_gate!
          const warnings: { text: string; level: 'critical' | 'warning' }[] = []
          if (ag.broadcast_sighting_location === 'blocked') {
            warnings.push({ text: 'Avistamentos PRIVADOS — não partilhar localização publicamente.', level: 'critical' })
          } else if (ag.broadcast_sighting_location === 'private_coordinator_only') {
            warnings.push({ text: 'Avistamentos apenas para o coordenador — não partilhar em redes sociais.', level: 'warning' })
          }
          if (ag.crowd_response_blocked) {
            warnings.push({ text: 'Buscas activas suspensas — máximo 1-2 pessoas silenciosas. Sem grupos.', level: 'critical' })
          }
          if (ag.name_calling_blocked) {
            warnings.push({ text: 'NÃO chame o nome do cão — pode ser gatilho de fuga.', level: 'critical' })
          }
          if (ag.drone_blocked) {
            warnings.push({ text: 'Sem drones — causam deslocação em cães assustados.', level: 'warning' })
          }
          if (warnings.length === 0) return null
          return (
            <section style={{ padding: '0 32px 20px' }}>
              <div style={{ display: 'grid', gap: 8 }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px',
                    background: w.level === 'critical' ? '#FEF2F2' : '#FFFBEB',
                    border: `1.5px solid ${w.level === 'critical' ? '#DC262633' : '#D9770633'}`,
                    borderRadius: 10,
                  }}>
                    <span style={{ fontSize: 14, lineHeight: 1, marginTop: 1 }}>{w.level === 'critical' ? '🔴' : '🟡'}</span>
                    <span style={{ fontSize: 13.5, color: w.level === 'critical' ? '#991B1B' : '#92400E', lineHeight: 1.45, fontWeight: 500 }}>{w.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )
        })()
      )}

      {/* WP12 FIELD GUIDE — time-indexed protocol */}
      {(() => {
        const msSinceLoss = Date.now() - new Date(c.last_seen_at).getTime()
        const hoursLost = msSinceLoss / 3600000
        const bp = c.behavioral_profile
        const ag = bp?.action_gate
        const isHard = (
          bp?.breed_category === 'galgo' || bp?.breed_category === 'podenco' ||
          bp?.temperament === 'xenophobic' || bp?.escape_trigger === 'blind_panic' ||
          ag?.crowd_response_blocked === true
        )

        type Bucket = { label: string; items: string[]; warning?: string | undefined }
        let bucket: Bucket

        if (hoursLost < 6) {
          bucket = {
            label: 'Primeiras 6 horas',
            items: [
              'Roupa usada (sem perfume) no ponto exacto de desaparecimento',
              'Cartaz A4 com foto nas 10 lojas/paragens mais próximas',
              'Notifique canil municipal e 3 clínicas veterinárias próximas',
              'Grupo Facebook local: cruzamento mais próximo (não GPS)',
              'Estação de alimentação: tigela + água no local de fuga',
            ],
          }
        } else if (hoursLost < 24) {
          bucket = {
            label: '6-24 horas',
            items: [
              'Visite pessoalmente o canil municipal — não ligue, vá em pessoa (Lord 2007: 2.1× recuperação)',
              'Verifique chip no SIAC (siac.vet.pt)',
              'Expanda cartazes a raio 5km + clínicas veterinárias da área',
              'Registe na GNR/PSP local',
              'Estação: reabastecimento às 6h e 22h apenas',
            ],
          }
        } else if (hoursLost < 96) {
          bucket = {
            label: 'Dias 2-4 — fase de sobrevivência',
            items: [
              'Câmara de movimento: mín. 2 câmaras, altura 15-50cm, isca = hot dogs / frango BBQ',
              'Pico de actividade: 22:00-06:00 — verifique câmara remotamente',
              'Estação: NÃO mova, NÃO altere — consistência é chave',
              'Canil: visita pessoal cada 48h, mostre novas fotos',
            ],
            warning: isHard ? 'Perfil passivo: câmara substitui visitas ao local' : undefined,
          }
        } else if (hoursLost < 240) {
          bucket = {
            label: 'Dias 5-10',
            items: [
              'Câmara confirma actividade → active armadilha humanitária (jaula coberta)',
              'Verifique canils nos concelhos vizinhos pessoalmente',
              'Publique em grupos Algarve regionais (não só locais)',
              'Mantenha estação activa — mínimo 14 dias',
            ],
            warning: 'Captura após >5 dias: risco de síndrome de realimentação — não alimente sem veterinário',
          }
        } else {
          bucket = {
            label: 'Dia 10+',
            items: [
              'Visite TODOS os canils num raio 60km — pessoalmente',
              'Verifique adopções recentes (últimos 30 dias) no canil',
              'Contacte AMAL, APPA, associações locais de resgate',
              'Reponha cartazes — os antigos desbotam',
              'Mantenha estação activa — cães são encontrados meses depois',
            ],
            warning: 'Captura após longa ausência: contacte veterinário ANTES de alimentar',
          }
        }

        return (
          <section style={{ padding: '0 32px 20px' }}>
            <div style={{ background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>protocolo activo</span>
                <span style={{ fontFamily: N.display, fontSize: 15, fontWeight: 400, letterSpacing: '-0.01em', color: N.ink }}>{bucket.label}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {bucket.items.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
                    <span style={{ color: '#16A34A', fontSize: 10, marginTop: 3, flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {bucket.warning && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, fontSize: 12, color: '#713F12', lineHeight: 1.45 }}>
                  ⚠️ {bucket.warning}
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* WP10 ENVIRONMENT PANEL — activity windows + physical context */}
      {(() => {
        const currentMonth = new Date().getMonth() + 1
        const isPeakSummer = currentMonth >= 7 && currentMonth <= 8
        const isSummer = currentMonth >= 6 && currentMonth <= 9
        const isNortada = currentMonth >= 5 && currentMonth <= 9

        type Windows = { dawn: string; dusk: string; deadZone?: string }
        const windows: Windows = isPeakSummer
          ? { dawn: '05:30–09:00', dusk: '19:30–21:30', deadZone: '11:00–18:00' }
          : isSummer
          ? { dawn: '06:00–09:30', dusk: '19:00–21:00', deadZone: '12:00–17:00' }
          : isNortada
          ? { dawn: '06:30–09:30', dusk: '18:30–20:30', deadZone: '12:00–16:00' }
          : { dawn: '07:00–09:30', dusk: '17:00–19:00' }

        const msSinceLoss = Date.now() - new Date(c.last_seen_at).getTime()
        const daysLost = msSinceLoss / 86400000
        const waterUrgencyDay = isSummer ? 2 : 3
        const waterUrgent = daysLost >= waterUrgencyDay

        const BRACHY = ['bulldog', 'pug', 'boxer', 'shih tzu', 'french', 'boston', 'cavalier', 'pekinese', 'shar pei', 'chow']
        const breedLower = c.breed.toLowerCase()
        const isBrachy = BRACHY.some(b => breedLower.includes(b))
        const isLarge = c.size === 'grande'
        const heatstrokeRisk = isSummer && (isBrachy || isLarge)

        const temperament = c.behavioral_profile?.temperament
        const escTrigger = c.behavioral_profile?.escape_trigger
        const transportRisk = (temperament === 'gregarious' || escTrigger === 'opportunistic')
          ? 'high' : temperament === 'xenophobic' ? 'very_low' : 'moderate'

        return (
          <section style={{ padding: '0 32px 20px' }}>
            <div style={{ background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 12, padding: '14px 18px', display: 'grid', gap: 10 }}>
              <div style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                janelas de actividade · ambiente físico
              </div>

              {/* Dawn/dusk/dead zone row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ padding: '5px 10px', borderRadius: 7, background: '#FEF9C3', border: '1px solid #FDE047', fontFamily: N.mono, fontSize: 11.5, color: '#713F12' }}>
                  🌅 Amanhecer · {windows.dawn}
                </span>
                <span style={{ padding: '5px 10px', borderRadius: 7, background: '#FEF9C3', border: '1px solid #FDE047', fontFamily: N.mono, fontSize: 11.5, color: '#713F12' }}>
                  🌆 Crepúsculo · {windows.dusk}
                </span>
                {windows.deadZone && (
                  <span style={{ padding: '5px 10px', borderRadius: 7, background: '#FEF2F2', border: '1px solid #FECACA', fontFamily: N.mono, fontSize: 11.5, color: '#991B1B' }}>
                    ❌ Zona morta · {windows.deadZone}
                  </span>
                )}
              </div>

              {/* Contextual alerts */}
              <div style={{ display: 'grid', gap: 5 }}>
                {isNortada && (
                  <div style={{ fontSize: 12, color: N.ink2, lineHeight: 1.45 }}>
                    🧭 <strong>Nortada activa</strong> — coloque estação de odor a norte/noroeste da zona do cão. O vento leva o odor para sul, em direcção ao cão.
                  </div>
                )}
                {waterUrgent && (
                  <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.45, padding: '7px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7 }}>
                    💧 <strong>Urgência de água</strong> (dia {Math.floor(daysLost)}+) — mapear fontes a 10km: reservatórios, campos de golfe, bebedouros. Câmara + armadilha junto à água é a colocação de maior rendimento.
                  </div>
                )}
                {heatstrokeRisk && (
                  <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.45, padding: '7px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7 }}>
                    🌡️ <strong>Risco de golpe de calor</strong> — buscas apenas ao amanhecer e ao crepúsculo. Se capturado com dificuldade respiratória: emergência veterinária imediata.
                  </div>
                )}
                {transportRisk === 'high' && (
                  <div style={{ fontSize: 12, color: N.ink2, lineHeight: 1.45 }}>
                    🚗 <strong>Risco de transporte alto</strong> — cão sociável pode ter sido apanhado por alguém. Verifique todos os canils do Algarve.
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* WP13 GEOGRAPHY PANEL — zone type, A22 barrier, terrain, fire risk */}
      {geo && (() => {
        const currentMonth = new Date().getMonth() + 1
        const isFireSeason = currentMonth >= 6 && currentMonth <= 10
        const isTouristPeak = (geo.tourist_peak_months ?? []).includes(currentMonth)

        const zoneColors: Record<string, { bg: string; border: string; color: string }> = {
          litoral:          { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
          barrocal:         { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
          serra_caldeirae:  { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
          serra_monchique:  { bg: '#DCFCE7', border: '#86EFAC', color: '#15803D' },
          sapal:            { bg: '#F0FDFA', border: '#99F6E4', color: '#0F766E' },
          litoral_fluvial:  { bg: '#ECFEFF', border: '#A5F3FC', color: '#0E7490' },
        }
        const fireColors: Record<string, { bg: string; border: string; color: string }> = {
          extreme:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
          high:     { bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412' },
          moderate: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
          low:      { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
        }

        const zc = zoneColors[geo.zone_type] ?? { bg: N.surface, border: N.rule, color: N.ink2 }

        const chips: { text: string; bg: string; border: string; color: string }[] = [
          { text: geo.zone_type.replace(/_/g, ' '), ...zc },
        ]
        if (geo.a22_side === 'bisected') {
          chips.push({ text: 'A22 atravessa', bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412' })
        } else if (geo.a22_side === 'north') {
          chips.push({ text: 'a norte da A22', bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' })
        }
        if (geo.terrain_permeability === 'dense') {
          chips.push({ text: 'terreno denso', bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' })
        }
        if (isFireSeason && geo.fire_risk_band !== 'low') {
          const fc = fireColors[geo.fire_risk_band] ?? fireColors['moderate']!
          chips.push({ text: `incêndio ${geo.fire_risk_band}`, ...fc })
        }
        if (geo.goatherd_zone) {
          chips.push({ text: 'zona de pastoreio', bg: '#F7FEE7', border: '#D9F99D', color: '#3F6212' })
        }
        if (isTouristPeak) {
          chips.push({ text: 'época turística', bg: '#FAF5FF', border: '#E9D5FF', color: '#7E22CE' })
        }

        return (
          <section style={{ padding: '0 32px 20px' }}>
            <div style={{ background: N.surface, border: `1px solid ${N.rule}`, borderRadius: 12, padding: '14px 18px', display: 'grid', gap: 10 }}>
              <div style={{ fontFamily: N.mono, fontSize: 10, color: N.ink3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                inteligência territorial · {geo.municipality.toLowerCase()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {chips.map((chip, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 7,
                    background: chip.bg, border: `1px solid ${chip.border}`,
                    fontFamily: N.mono, fontSize: 11.5, color: chip.color,
                  }}>
                    {chip.text}
                  </span>
                ))}
              </div>
              <div style={{ display: 'grid', gap: 5 }}>
                {geo.water_source_type === 'borehole_zone' && (
                  <div style={{ fontSize: 12, color: N.ink2, lineHeight: 1.45 }}>
                    💧 <strong>Zona de furos</strong> — ~20.000 furos privados no barrocal. O cão tem acesso a água escondida; armadilha junto a bebedouro de quinta privada tem maior rendimento que rio seco.
                  </div>
                )}
                {geo.terrain_permeability === 'dense' && (
                  <div style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.45, padding: '7px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7 }}>
                    🌲 <strong>Terreno denso</strong> — eucaliptal/maquis. Câmara + estação superam busca activa. Raio efectivo ~65% do calculado.
                  </div>
                )}
                {geo.goatherd_zone && (
                  <div style={{ fontSize: 12, color: '#3F6212', lineHeight: 1.45 }}>
                    🐐 <strong>Zona de pastoreio</strong> — contacte pastores e cabrieiros locais directamente. Presença diária no terreno, vêem animais que as câmaras não captam.
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* BEHAVIORAL SCENARIOS */}
      {c.behavioral_profile?.scenarios && c.behavioral_profile.scenarios.length > 0 && (
        <section style={{ padding: '0 32px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
              Cenários por probabilidade.
            </h2>
            <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
              baseado no perfil comportamental
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {c.behavioral_profile.sociability && (
              <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${N.rule}`, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>
                {c.behavioral_profile.sociability}
              </span>
            )}
            {c.behavioral_profile.environment && (
              <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${N.rule}`, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>
                {c.behavioral_profile.environment.replace('_', ' ')}
              </span>
            )}
            {c.behavioral_profile.stress_level && (
              <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${N.rule}`, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>
                {c.behavioral_profile.stress_level.replace('_', ' ')}
              </span>
            )}
            {c.behavioral_profile.breed_category && (
              <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${N.rule}`, fontFamily: N.mono, fontSize: 10.5, color: N.ink3 }}>
                {c.behavioral_profile.breed_category.replace('_', ' ')}
              </span>
            )}
            {c.behavioral_profile.phase_state?.current && (
              <span style={{ padding: '4px 10px', borderRadius: 999, background: '#F0F9FF', border: `1px solid #BAE6FD`, fontFamily: N.mono, fontSize: 10.5, color: '#0369A1' }}>
                {c.behavioral_profile.phase_state.current.replace('phase_', 'fase ').replace('_', ' ')}
              </span>
            )}
          </div>
          {c.behavioral_profile.scenarios.map((s: ProbabilityScenario, i: number) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 120, height: 6, background: N.rule, borderRadius: 3, flexShrink: 0 }}>
                  <div style={{ width: `${Math.round(s.probability * 100)}%`, height: '100%', background: N.ink, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: N.mono, fontSize: 12, color: N.ink, fontWeight: 600 }}>
                  {Math.round(s.probability * 100)}%
                </span>
                <span style={{ fontFamily: N.display, fontSize: 18, letterSpacing: '-0.015em', color: N.ink }}>
                  {s.title}
                </span>
              </div>
              {s.reasoning && (
                <p style={{ margin: '0 0 6px', fontSize: 12.5, color: N.ink3, fontStyle: 'italic' }}>{s.reasoning}</p>
              )}
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                {s.actions.map((a: string, j: number) => (
                  <li key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: N.ink2 }}>
                    <span style={{ color: N.ink4, fontSize: 10, marginTop: 3 }}>→</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ACTIVITY + SIDEBAR */}
      <section style={{ padding: '8px 32px 48px', display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 32, alignItems: 'flex-start' }}>
        <article>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}>
              O que está a acontecer.
            </h2>
          </div>
          <AgentFeed
            title="Atividade do caso"
            subtitle="auto-refresh"
            events={activityEvents}
            footer
          />
          <div style={{ marginTop: 32 }}>
            <h2 style={{ margin: 0, fontFamily: N.display, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em' }}>
              {c.context ? `"${c.context.slice(0, 60)}${c.context.length > 60 ? '…' : ''}"` : 'Descrição.'}
            </h2>
            <p style={{ margin: '12px 0 0', fontSize: 15.5, color: N.ink2, lineHeight: 1.65, maxWidth: 580 }}>
              {c.description}
            </p>
          </div>
        </article>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
          {/* share */}
          <div style={{ padding: 20, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <h3 style={{ margin: 0, fontFamily: N.display, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em' }}>
              Partilha em 30 segundos.
            </h3>
            <p style={{ margin: '4px 0 14px', fontSize: 13, color: N.ink2, lineHeight: 1.45 }}>
              Cada partilha aumenta a probabilidade de {dogName} voltar a casa.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Btn size="md" variant="ghost" icon={<Icon name="facebook" size={14}/>} full onClick={() => share('facebook')}>Facebook</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="whatsapp" size={14}/>} full onClick={() => share('whatsapp')}>WhatsApp</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="telegram" size={14}/>} full onClick={() => share('telegram')}>Telegram</Btn>
              <Btn size="md" variant="ghost" icon={<Icon name="share" size={14}/>} full>Mais</Btn>
            </div>
            <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, background: N.surface, fontFamily: N.mono, fontSize: 11.5, color: N.ink2, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortUrl}</span>
              <button onClick={copyUrl} style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                {copied ? 'copiado ✓' : 'copiar'}
              </button>
            </div>
          </div>

          {/* QR + poster */}
          <div style={{ padding: 18, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ padding: 6, background: N.surface, borderRadius: 8 }}>
              <QRTile size={104}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontFamily: N.display, fontSize: 18, fontWeight: 400, letterSpacing: '-0.015em' }}>Cartaz pronto.</h4>
              <p style={{ margin: '4px 0 10px', fontSize: 12.5, color: N.ink2, lineHeight: 1.45 }}>
                A4 com QR. Para clínicas, paragens, mercearias.
              </p>
              <Link href={`/api/cases/${c.slug}/poster?locale=${locale}`}>
                <Btn size="sm" variant="ghost" icon={<Icon name="download" size={13}/>}>A4 · PT</Btn>
              </Link>
            </div>
          </div>

          {/* next steps */}
          <div style={{ padding: 16, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14 }}>
            <h4 style={{ margin: 0, fontFamily: N.display, fontSize: 16, fontWeight: 400, letterSpacing: '-0.015em' }}>Próximos passos automáticos</h4>
            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: 12.5, color: N.ink2 }}>
              {[
                'recheck visual se houver 5+ avistamentos',
                'update à comunidade em 24h se sem novidades',
                'alerta a clínicas veterinárias se passarem 48h',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ marginTop: 5, width: 5, height: 5, borderRadius: '50%', background: N.ink3, flexShrink: 0 }}/>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* contact (only if reporter set it public) */}
          {c.reporter_contact_public && (
            <div style={{ padding: 16, background: N.indigoBg, border: `1px solid ${N.indigo}33`, borderRadius: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: N.indigoDeep, lineHeight: 1.5 }}>
                <strong>Contacto público:</strong> {c.reporter_contact_public}
              </p>
            </div>
          )}
        </aside>
      </section>

      {/* footer */}
      <footer style={{ padding: '20px 32px', borderTop: `1px solid ${N.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: N.mono, fontSize: 11, color: N.ink3 }}>
        <span>nona · open source · made in algarve · 2026</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <span>privacidade</span>
          <span>como funciona</span>
          <span>parceiros</span>
        </span>
      </footer>
    </div>
  )
}
