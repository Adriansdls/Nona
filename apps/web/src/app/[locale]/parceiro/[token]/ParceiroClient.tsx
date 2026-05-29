'use client'
import React, { useState, useEffect, useRef } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { Icon } from '@/components/nona/Icon'

const MUNICIPALITIES = [
  'Faro', 'Loulé', 'Albufeira', 'Portimão', 'Lagos', 'Silves', 'Olhão', 'Tavira',
  'Vila Real de Santo António', 'Castro Marim', 'Alcoutim', 'São Brás de Alportel',
  'Monchique', 'Aljezur', 'Vila do Bispo', 'Lagoa',
]

type PartnerCase = { slug: string; dog_name: string | null; breed: string; type: string; status: string; municipality: string; img: string | null }

export function ParceiroClient({ locale, token, partner, pinnedUrl }: {
  locale: string; token: string
  partner: { name: string; municipality: string | null; intake_slug: string }
  pinnedUrl: string
}) {
  const [cases, setCases] = useState<PartnerCase[]>([])
  const [copied, setCopied] = useState(false)
  // submit state
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [municipality, setMunicipality] = useState(partner.municipality ?? '')
  const [zone, setZone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadCases = () => fetch(`/api/partner/${token}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setCases(d.cases) }).catch(() => {})
  useEffect(() => { loadCases() }, [token])

  async function pickPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('photo', file)
      const res = await fetch('/api/intake/upload', { method: 'POST', body: fd })
      if (res.ok) { const { path } = await res.json(); setPhoto({ path, preview: URL.createObjectURL(file) }) }
    } finally { setUploading(false) }
  }

  async function submit() {
    if (!photo || !municipality) return
    setSubmitting(true); setSubmitMsg(null)
    try {
      const res = await fetch('/api/finder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagedPhotoPath: photo.path, municipality, zone, partnerId: partner.intake_slug }),
      })
      if (res.ok) {
        const d = await res.json()
        setSubmitMsg(d.message ?? 'Submetido.')
        setPhoto(null); setZone('')
        loadCases()
      }
    } finally { setSubmitting(false) }
  }

  const canSubmit = photo && municipality && !submitting
  return (
    <div style={{ minHeight: '100dvh', background: N.paper, fontFamily: N.sans }}>
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>painel de parceiro</span>
      </header>
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontFamily: N.display, fontWeight: 400, fontSize: 30, letterSpacing: '-0.02em', color: N.ink, margin: '0 0 4px' }}>
          {partner.name}
        </h1>
        <p style={{ fontSize: 14, color: N.ink3, margin: '0 0 24px' }}>{partner.municipality ?? 'Algarve'}</p>

        {/* Pinned link */}
        <div style={{ padding: 16, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, marginBottom: 22 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, color: N.ink2, lineHeight: 1.5 }}>
            Fixa este link no teu grupo. Quem vir um cão carrega aqui — cruzamos com os perdidos na hora.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: N.surface, borderRadius: 8, padding: '9px 12px' }}>
            <span style={{ flex: 1, fontFamily: N.mono, fontSize: 11.5, color: N.ink2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinnedUrl}</span>
            <button onClick={() => { navigator.clipboard?.writeText(pinnedUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              style={{ background: 'transparent', border: 'none', color: N.ink, fontFamily: N.mono, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
              {copied ? 'copiado ✓' : 'copiar'}
            </button>
          </div>
        </div>

        {/* Admin submits a dog */}
        <div style={{ padding: 18, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 14, marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 12px', fontFamily: N.display, fontSize: 18, fontWeight: 400, color: N.ink }}>Submeter um cão visto</h3>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) void pickPhoto(f); e.target.value = '' }} />
          <button onClick={() => fileRef.current?.click()}
            style={{ width: '100%', minHeight: photo ? 0 : 120, border: `1.5px dashed ${N.rule}`, borderRadius: 12, background: N.surface, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: photo ? 10 : 0, marginBottom: 12 }}>
            {photo ? <img src={photo.preview} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 220, objectFit: 'cover' }} />
              : <><Icon name="photo" size={24} color={N.ink3} /><span style={{ fontSize: 13, color: N.ink3 }}>{uploading ? 'a carregar…' : 'Foto do cão'}</span></>}
          </button>
          <select value={municipality} onChange={e => setMunicipality(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid ${N.rule}`, background: N.white, fontSize: 14.5, color: N.ink, marginBottom: 10, fontFamily: N.sans }}>
            <option value="">Concelho…</option>
            {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input value={zone} onChange={e => setZone(e.target.value)} placeholder="Zona/cruzamento (opcional)"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid ${N.rule}`, fontSize: 14.5, color: N.ink, marginBottom: 14, fontFamily: N.sans }} />
          <button onClick={submit} disabled={!canSubmit}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: canSubmit ? N.ink : N.rule, color: canSubmit ? N.paper : N.ink4, fontSize: 15, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'default', fontFamily: N.sans }}>
            {submitting ? 'A cruzar…' : 'Cruzar com perdidos'}
          </button>
          {submitMsg && <p style={{ margin: '10px 0 0', fontSize: 13, color: N.emeraldDeep, background: N.emeraldBg, padding: '9px 11px', borderRadius: 8 }}>{submitMsg}</p>}
        </div>

        {/* Community sightings */}
        <h3 style={{ margin: '0 0 12px', fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Cães da tua comunidade ({cases.length})
        </h3>
        {cases.length === 0 ? (
          <p style={{ fontSize: 13.5, color: N.ink3 }}>Ainda nada. Quando alguém usar o teu link, aparece aqui.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {cases.map(c => (
              <a key={c.slug} href={`/${locale}/caso/${c.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 12, background: N.white, border: `1px solid ${N.rule}`, borderRadius: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', background: N.surface, flexShrink: 0 }}>
                    {c.img && <img src={c.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: N.display, fontSize: 18, color: N.ink }}>{c.dog_name ?? c.breed}</div>
                    <div style={{ fontSize: 12, color: N.ink3, fontFamily: N.mono }}>{c.municipality} · {c.type}</div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: N.mono, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: c.status === 'resolvido' ? N.emeraldBg : N.amberBg, color: c.status === 'resolvido' ? N.emeraldDeep : N.amber }}>
                    {c.status === 'resolvido' ? 'reunido 🎉' : c.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
