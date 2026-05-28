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
interface ProbabilityScenario {
  title: string
  probability: number
  reasoning?: string
  actions: string[]
}

interface BehavioralProfile {
  sociability?: string
  environment?: string
  stress_level?: string
  scenarios?: ProbabilityScenario[]
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
  }
}

export function CasePageClient({ locale, data }: CasePageClientProps) {
  const { case: c, sightings, stats } = data
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
