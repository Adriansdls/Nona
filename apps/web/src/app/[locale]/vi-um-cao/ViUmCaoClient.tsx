'use client'
import React, { useState, useRef } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'
import { Icon } from '@/components/nona/Icon'

const MUNICIPALITIES = [
  'Faro', 'Loulé', 'Albufeira', 'Portimão', 'Lagos', 'Silves', 'Olhão', 'Tavira',
  'Vila Real de Santo António', 'Castro Marim', 'Alcoutim', 'São Brás de Alportel',
  'Monchique', 'Aljezur', 'Vila do Bispo', 'Lagoa',
]

// WS-D — pin-pam-ya finder: photo + municipality + zone + tap. No account.
export function ViUmCaoClient({ locale, partnerId }: { locale: string; partnerId?: string }) {
  const en = locale === 'en'
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [municipality, setMunicipality] = useState('')
  const [zone, setZone] = useState('')
  const [note, setNote] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ result: string; caseSlug: string; message: string; dogName?: string | null; score?: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickPhoto(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await fetch('/api/intake/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { path } = await res.json() as { path: string }
        setPhoto({ path, preview: URL.createObjectURL(file) })
      }
    } finally { setUploading(false) }
  }

  async function submit() {
    if (!photo || !municipality) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/finder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagedPhotoPath: photo.path, municipality, zone, note, contact, partnerId }),
      })
      if (res.ok) setResult(await res.json())
    } finally { setSubmitting(false) }
  }

  if (result) {
    return (
      <div style={{ minHeight: '100dvh', background: N.paper, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: N.sans }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{result.result === 'matched' ? '🎯' : '🐾'}</div>
        <h1 style={{ fontFamily: N.display, fontWeight: 400, fontSize: 30, color: N.ink, margin: '0 0 12px', maxWidth: 460 }}>
          {result.result === 'matched'
            ? (en ? 'Possible match found' : 'Possível correspondência')
            : (en ? 'Thank you' : 'Obrigado')}
        </h1>
        <p style={{ fontSize: 15.5, color: N.ink2, lineHeight: 1.6, maxWidth: 440, margin: '0 0 24px' }}>{result.message}</p>
        <a href={`/${locale}/caso/${result.caseSlug}`} style={{ padding: '12px 22px', borderRadius: 10, background: N.ink, color: N.paper, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          {en ? 'View case →' : 'Ver caso →'}
        </a>
      </div>
    )
  }

  const canSubmit = photo && municipality && !submitting
  return (
    <div style={{ minHeight: '100dvh', background: N.paper, fontFamily: N.sans }}>
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {en ? 'i saw a dog' : 'vi um cão'}
        </span>
      </header>
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontFamily: N.display, fontWeight: 400, fontSize: 34, letterSpacing: '-0.02em', color: N.ink, margin: '0 0 8px' }}>
          {en ? 'Did you see a stray dog?' : 'Viste um cão à solta?'}
        </h1>
        <p style={{ fontSize: 15, color: N.ink3, lineHeight: 1.55, margin: '0 0 28px' }}>
          {en ? 'A photo and where. We cross-check it against lost dogs instantly.' : 'Uma foto e onde. Cruzamos com os cães perdidos na hora.'}
        </p>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) void pickPhoto(f); e.target.value = '' }} />

        {/* photo */}
        <button onClick={() => fileRef.current?.click()}
          style={{ width: '100%', aspectRatio: photo ? 'auto' : '3/2', minHeight: photo ? 0 : 160, border: `1.5px dashed ${N.rule}`, borderRadius: 14, background: N.white, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: photo ? 12 : 0, marginBottom: 18 }}>
          {photo ? (
            <img src={photo.preview} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 280, objectFit: 'cover' }} />
          ) : (
            <><Icon name="photo" size={28} color={N.ink3} /><span style={{ fontSize: 14, color: N.ink3 }}>{uploading ? (en ? 'uploading…' : 'a carregar…') : (en ? 'Tap to add a photo' : 'Toca para tirar/anexar foto')}</span></>
          )}
        </button>

        {/* municipality */}
        <label style={{ display: 'block', fontSize: 12.5, color: N.ink3, marginBottom: 6 }}>{en ? 'Where? (municipality)' : 'Onde? (concelho)'}</label>
        <select value={municipality} onChange={e => setMunicipality(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${N.rule}`, background: N.white, fontSize: 15, color: N.ink, marginBottom: 14, fontFamily: N.sans }}>
          <option value="">{en ? 'Select…' : 'Seleciona…'}</option>
          {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <input value={zone} onChange={e => setZone(e.target.value)} placeholder={en ? 'Nearest landmark/street (optional)' : 'Cruzamento/rua mais próxima (opcional)'}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${N.rule}`, background: N.white, fontSize: 15, color: N.ink, marginBottom: 14, fontFamily: N.sans }} />
        <input value={contact} onChange={e => setContact(e.target.value)} placeholder={en ? 'Your contact (optional)' : 'O teu contacto (opcional)'}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${N.rule}`, background: N.white, fontSize: 15, color: N.ink, marginBottom: 22, fontFamily: N.sans }} />

        <button onClick={submit} disabled={!canSubmit}
          style={{ width: '100%', padding: '15px', borderRadius: 12, border: 'none', background: canSubmit ? N.ink : N.rule, color: canSubmit ? N.paper : N.ink4, fontSize: 16, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'default', fontFamily: N.sans }}>
          {submitting ? (en ? 'Checking…' : 'A verificar…') : (en ? 'Check for a match' : 'Cruzar com perdidos')}
        </button>
      </main>
    </div>
  )
}
