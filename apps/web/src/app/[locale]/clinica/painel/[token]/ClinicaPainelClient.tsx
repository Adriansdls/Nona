'use client'
import React, { useState } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'

interface Scan {
  scanId: string
  chipNumber: string
  chipLast3: string
  siacStatus: string
  ownerName: string | null
  ownerContact: string | null
  notes: string | null
  createdAt: string
  case: {
    slug: string
    dogName: string | null
    breed: string | null
    status: string
    municipality: string | null
    zone: string | null
    lastSeenAt: string | null
    reporterName: string | null
    reporterEmail: string | null
    reporterPhone: string | null
    ownerToken: string | null
    img: string | null
    adRecommendation: {
      eligible: boolean
      radiusKm: number
      dailyBudgetEur: number
      rationale: string
    } | null
  } | null
}

interface Clinic {
  id: string
  name: string
  municipality: string | null
  contactEmail: string | null
  contactPhone: string | null
  vetLicense: string | null
  intakeSlug: string
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusColor(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case 'nao_realizado':
      return { bg: N.amberBg, color: N.amber, label: 'não realizado' }
    case 'contactado_siac':
      return { bg: N.indigoBg, color: N.indigo, label: 'contactado SIAC' }
    case 'dono_encontrado':
      return { bg: N.emeraldBg, color: N.emeraldDeep, label: 'dono encontrado' }
    case 'nao_registado':
      return { bg: N.roseBg, color: N.rose, label: 'não registado' }
    default:
      return { bg: N.surface, color: N.ink3, label: status }
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
    >
      {copied ? 'copiado ✓' : 'copiar'}
    </button>
  )
}

export function ClinicaPainelClient({
  locale, token, clinic, scans, pinnedUrl,
}: {
  locale: string
  token: string
  clinic: Clinic
  scans: Scan[]
  pinnedUrl: string
}) {
  const [copiedLink, setCopiedLink] = useState(false)

  return (
    <div style={{ minHeight: '100dvh', background: N.paper, fontFamily: N.sans }}>
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          painel · {clinic.name} · privado
        </span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontFamily: N.display, fontWeight: 400, fontSize: 30, letterSpacing: '-0.02em', color: N.ink, margin: '0 0 4px' }}>
          {clinic.name}
        </h1>
        <p style={{ fontSize: 14, color: N.ink3, margin: '0 0 24px' }}>
          {clinic.municipality ?? 'Algarve'}{clinic.vetLicense ? ` · Lic. ${clinic.vetLicense}` : ''}
        </p>

        {/* Pinned link */}
        <div style={{ padding: 16, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, marginBottom: 22 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, color: N.ink2, lineHeight: 1.5 }}>
            Fixa este link na recepção. Quando alguém encontrar um cão, preenche aqui — cruzamos com os perdidos na hora.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: N.surface, borderRadius: 8, padding: '9px 12px' }}>
            <span style={{ flex: 1, fontFamily: N.mono, fontSize: 11.5, color: N.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pinnedUrl}
            </span>
            <button
              onClick={() => { navigator.clipboard?.writeText(pinnedUrl); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 1500) }}
              style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {copiedLink ? 'copiado ✓' : 'copiar'}
            </button>
          </div>
        </div>

        {/* Scans */}
        <h3 style={{ margin: '0 0 12px', fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Leituras de chip ({scans.length})
        </h3>

        {scans.length === 0 ? (
          <p style={{ fontSize: 13.5, color: N.ink3 }}>Ainda sem leituras. Quando fizeres um scan, aparece aqui.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {scans.map(s => {
              const st = statusColor(s.siacStatus)
              return (
                <div
                  key={s.scanId}
                  style={{ background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, padding: '16px 18px' }}
                >
                  {/* Chip row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontFamily: N.mono, fontSize: 15, fontWeight: 700, color: N.ink, letterSpacing: '0.02em' }}>
                      {s.chipNumber}
                    </span>
                    <span
                      style={{
                        fontFamily: N.mono, fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                        background: N.surface, color: N.ink3, letterSpacing: '0.05em',
                      }}
                    >
                      {s.chipLast3}
                    </span>
                    <span
                      style={{
                        fontSize: 11, fontFamily: N.mono, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                        background: st.bg, color: st.color,
                      }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Case link */}
                  {s.case && (
                    <a
                      href={`/${locale}/caso/${s.case.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 12 }}
                    >
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, background: N.surface, borderRadius: 12 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: N.paper, flexShrink: 0 }}>
                          {s.case.img && (
                            <img src={s.case.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: N.display, fontSize: 17, color: N.ink }}>
                            {s.case.dogName ?? s.case.breed ?? 'Cão'}
                          </div>
                          <div style={{ fontSize: 12, color: N.ink3, fontFamily: N.mono, marginTop: 2 }}>
                            {s.case.municipality}{s.case.zone ? ` · ${s.case.zone}` : ''}
                          </div>
                          <div style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono, marginTop: 4 }}>
                            {s.case.status}
                          </div>
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Owner contact */}
                  {s.ownerContact && (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        padding: '10px 12px', background: N.emeraldBg, borderRadius: 10, marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: N.emeraldDeep, fontWeight: 500 }}>
                        {s.ownerName ? `${s.ownerName} · ` : ''}{s.ownerContact}
                      </span>
                      <CopyButton text={s.ownerContact} />
                    </div>
                  )}

                  {/* Notes */}
                  {s.notes && (
                    <p style={{ margin: '0 0 10px', fontSize: 13.5, color: N.ink2, lineHeight: 1.5 }}>
                      {s.notes}
                    </p>
                  )}

                  {/* Date */}
                  <div style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono }}>
                    {fmtDate(s.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
