'use client'

import React, { useState, useRef } from 'react'
import { N } from '@/components/nona/tokens'
import { Logo } from '@/components/nona/Logo'

const MUNICIPALITIES = [
  'Faro', 'Loulé', 'Albufeira', 'Portimão', 'Lagos', 'Silves', 'Olhão', 'Tavira',
  'Vila Real de Santo António', 'Castro Marim', 'Alcoutim', 'São Brás de Alportel',
  'Monchique', 'Aljezur', 'Vila do Bispo', 'Lagoa',
]

function fmtChip(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 15)
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
}

interface Result {
  result: 'matched' | 'chip_known' | 'created'
  caseSlug: string
  dogName?: string | null
  score?: number
  message: string
  panelUrl: string
}

export function ClinicaClient({ locale, clinic }: {
  locale: string
  clinic: { name: string; municipality: string | null; intake_slug: string; panel_token: string }
}) {
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [chipRaw, setChipRaw] = useState('')
  const [municipality, setMunicipality] = useState(clinic.municipality ?? '')
  const [zone, setZone] = useState('')
  const [note, setNote] = useState('')
  const [vetName, setVetName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const chipDigits = chipRaw.replace(/\D/g, '')
  const hasMinInput = !!photo || chipDigits.length >= 1
  const canSubmit = municipality && hasMinInput && !submitting

  async function pickPhoto(file: File) {
    setUploading(true)
    setErr(null)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await fetch('/api/intake/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const { path } = await res.json()
        setPhoto({ path, preview: URL.createObjectURL(file) })
      } else {
        setErr('Falha ao carregar foto. Tenta outra vez.')
      }
    } catch {
      setErr('Erro de rede ao carregar foto.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setErr(null)
    setResult(null)
    try {
      const res = await fetch('/api/clinic/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeSlug: clinic.intake_slug,
          stagedPhotoPath: photo?.path,
          chipNumber: chipDigits || undefined,
          municipality,
          zone: zone || undefined,
          note: note || undefined,
          vetName: vetName || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data) {
        setResult(data as Result)
        setPhoto(null)
        setChipRaw('')
        setZone('')
        setNote('')
        setVetName('')
      } else {
        setErr(data?.error ?? 'Erro ao submeter. Verifica os dados.')
      }
    } catch {
      setErr('Erro de rede. Tenta outra vez.')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    padding: 18,
    background: N.white,
    border: `1px solid ${N.rule}`,
    borderRadius: 14,
    marginBottom: 14,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: N.mono,
    fontSize: 11,
    color: N.ink3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 9,
    border: `1px solid ${N.rule}`,
    background: N.white,
    fontSize: 14.5,
    color: N.ink,
    fontFamily: N.sans,
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100dvh', background: N.paper, fontFamily: N.sans }}>
      <header style={{ borderBottom: `1px solid ${N.rule}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Logo size={16} />
        <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Registar chip · {clinic.name}
        </span>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontFamily: N.display, fontWeight: 400, fontSize: 28, letterSpacing: '-0.02em', color: N.ink, margin: '0 0 4px' }}>
          Registar chip
        </h1>
        <p style={{ fontSize: 14, color: N.ink3, margin: '0 0 24px' }}>
          {clinic.municipality ?? 'Algarve'}
        </p>

        <div style={cardStyle}>
          {/* Photo */}
          <label style={labelStyle}>Foto do cão</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) void pickPhoto(f)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              minHeight: photo ? 0 : 140,
              border: `1.5px dashed ${uploading ? N.indigo : N.rule}`,
              borderRadius: 12,
              background: photo ? N.white : N.surface,
              cursor: uploading ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: photo ? 0 : 0,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            {photo ? (
              <img
                src={photo.preview}
                alt=""
                style={{ width: '100%', borderRadius: 8, maxHeight: 260, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <>
                <span style={{ fontSize: 22 }}>📷</span>
                <span style={{ fontSize: 13, color: uploading ? N.indigo : N.ink3 }}>
                  {uploading ? 'A carregar…' : 'Câmara ou galeria'}
                </span>
              </>
            )}
          </button>

          {/* Chip number */}
          <label style={labelStyle}>Número de chip</label>
          <input
            type="text"
            inputMode="numeric"
            value={fmtChip(chipRaw)}
            onChange={e => setChipRaw(e.target.value)}
            placeholder="XXX XXX XXX XXX XXX"
            style={{ ...inputBase, marginBottom: 16 }}
          />

          {/* Municipality */}
          <label style={labelStyle}>Concelho *</label>
          <select
            value={municipality}
            onChange={e => setMunicipality(e.target.value)}
            style={{ ...inputBase, marginBottom: 16 }}
          >
            <option value="">Escolhe o concelho…</option>
            {MUNICIPALITIES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Zone */}
          <label style={labelStyle}>Zona / cruzamento</label>
          <input
            type="text"
            value={zone}
            onChange={e => setZone(e.target.value)}
            placeholder="Ex: Quarteira, EN125 km 12"
            style={{ ...inputBase, marginBottom: 16 }}
          />

          {/* Notes */}
          <label style={labelStyle}>Notas</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Observações opcionais…"
            style={{
              ...inputBase,
              marginBottom: 16,
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />

          {/* Vet name (optional, internal) */}
          <label style={labelStyle}>Veterinário</label>
          <input
            type="text"
            value={vetName}
            onChange={e => setVetName(e.target.value)}
            placeholder="Nome do veterinário (opcional)"
            style={{ ...inputBase, marginBottom: 20 }}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 10,
              border: 'none',
              background: canSubmit ? N.ink : N.rule,
              color: canSubmit ? N.paper : N.ink4,
              fontSize: 15,
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: N.sans,
            }}
          >
            {submitting ? 'A registar…' : 'Registar e cruzar'}
          </button>

          {/* Error */}
          {err && (
            <p style={{
              margin: '12px 0 0',
              fontSize: 13,
              color: N.roseDeep,
              background: N.roseBg,
              padding: '9px 11px',
              borderRadius: 8,
            }}>
              {err}
            </p>
          )}
        </div>

        {/* Result card */}
        {result && (
          <div style={{ ...cardStyle, background: N.emeraldBg, borderColor: '#a7f3d0' }}>
            <p style={{
              margin: '0 0 10px',
              fontSize: 14,
              color: N.emeraldDeep,
              lineHeight: 1.5,
              fontWeight: 500,
            }}>
              {result.message}
            </p>

            <div style={{
              background: N.white,
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 12,
            }}>
              <span style={{ fontFamily: N.mono, fontSize: 11, color: N.ink3, display: 'block', marginBottom: 4 }}>
                SLUG
              </span>
              <a
                href={`/${locale}/caso/${result.caseSlug}`}
                style={{
                  fontFamily: N.mono,
                  fontSize: 14,
                  color: N.indigo,
                  wordBreak: 'break-all',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {result.caseSlug}
              </a>
            </div>

            <a
              href={`/${locale}${result.panelUrl}`}
              style={{
                display: 'inline-block',
                fontFamily: N.mono,
                fontSize: 12,
                color: N.emeraldDeep,
                textDecoration: 'none',
                borderBottom: `1px solid ${N.emeraldDeep}`,
                paddingBottom: 1,
              }}
            >
              Painel da clínica →
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
