'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { N } from '@/components/nona/tokens'
import { NonaNav } from '@/components/nona/NonaNav'
import { Btn } from '@/components/nona/Btn'
import { Icon } from '@/components/nona/Icon'

const FIELD = {
  display: 'block', width: '100%', boxSizing: 'border-box' as const,
  padding: '11px 13px', borderRadius: 10, border: `1px solid ${N.rule}`,
  background: N.white, color: N.ink, fontSize: 14.5, fontFamily: N.sans,
}
const LABEL = { display: 'block', marginBottom: 6, fontFamily: N.mono, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: N.ink3 }

export default function AvistamentoClient({ dogName }: { dogName: string }) {
  const params = useParams()
  const slug = params['slug'] as string
  const locale = params['locale'] as string

  const [zone, setZone] = useState('')
  const [desc, setDesc] = useState('')
  const [contact, setContact] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locState, setLocState] = useState<'idle' | 'getting' | 'ok' | 'err'>('idle')
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const useLocation = () => {
    if (!navigator.geolocation) { setLocState('err'); return }
    setLocState('getting')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocState('ok') },
      () => setLocState('err'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const onPhoto = async (file: File) => {
    setUploading(true); setErr(null)
    setPhotoPreview(URL.createObjectURL(file))
    try {
      const fd = new FormData(); fd.append('photo', file)
      const r = await fetch('/api/intake/upload', { method: 'POST', body: fd })
      const body = await r.json()
      if (body.path) setPhotoPath(body.path); else setErr('Não consegui carregar a foto.')
    } catch { setErr('Não consegui carregar a foto.') }
    finally { setUploading(false) }
  }

  const submit = async () => {
    if (!zone.trim() && !coords) { setErr('Indica onde viste o cão (localização ou zona).'); return }
    setSubmitting(true); setErr(null)
    try {
      const caseRes = await fetch(`/api/cases/${slug}`)
      const caseData = await caseRes.json()
      if (!caseData.data?.id) { setErr('Caso não encontrado.'); setSubmitting(false); return }
      const payload: Record<string, unknown> = {
        seenAt: new Date().toISOString(),
        municipality: caseData.data.last_seen_municipality || 'Algarve',
        zoneApprox: zone.trim() || 'localização partilhada',
        observedTimeConfidence: 'exact', observedTimeSource: 'firsthand',
      }
      if (desc.trim()) payload['description'] = desc.trim()
      if (contact.trim()) payload['reporterContact'] = contact.trim()
      if (coords) { payload['latitude'] = coords.lat; payload['longitude'] = coords.lng }
      if (photoPath) payload['photoPath'] = photoPath
      const res = await fetch(`/api/sightings/${caseData.data.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (res.ok) setDone(true); else setErr('Algo correu mal. Tenta novamente.')
    } catch { setErr('Algo correu mal. Tenta novamente.') }
    finally { setSubmitting(false) }
  }

  if (done) {
    return (
      <div className="nn" style={{ background: N.paper, minHeight: '100vh' }}>
        <NonaNav />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🐾</div>
          <h1 style={{ fontFamily: N.display, fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>Obrigado.</h1>
          <p style={{ color: N.ink2, fontSize: 15.5, lineHeight: 1.6, marginTop: 12 }}>
            O teu avistamento entrou no caso. A equipa vai rever e, se for fiável, ajusta o protocolo de busca.
            Cada par de olhos como o teu aproxima {dogName} de casa.
          </p>
          <div style={{ marginTop: 20 }}>
            <a href={`/${locale}/caso/${slug}`} style={{ textDecoration: 'none' }}>
              <Btn variant="ghost" size="lg">Voltar ao caso</Btn>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nn" style={{ background: N.paper, minHeight: '100vh' }}>
      <NonaNav />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 60px' }}>
        <h1 style={{ fontFamily: N.display, fontSize: 36, fontWeight: 400, letterSpacing: '-0.025em', margin: 0 }}>
          Viste o {dogName}?
        </h1>
        <p style={{ color: N.ink2, fontSize: 14.5, lineHeight: 1.55, margin: '8px 0 6px' }}>
          Não te aproximes nem o chames — um cão assustado foge. Observa de longe, e diz-nos onde.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22 }}>
          {/* Location — the most important field */}
          <div>
            <span style={LABEL}>Onde está? *</span>
            <Btn variant={locState === 'ok' ? 'soft' : 'primary'} tone={locState === 'ok' ? 'emerald' : 'ink'} size="lg" full
              icon={<Icon name={locState === 'ok' ? 'eye' : 'paw'} size={16} color={locState === 'ok' ? N.emerald : N.paper} />}
              onClick={useLocation}>
              {locState === 'getting' ? 'a obter localização…'
                : locState === 'ok' ? 'localização partilhada ✓'
                : 'Partilhar a minha localização'}
            </Btn>
            {locState === 'err' && <p style={{ margin: '6px 0 0', fontSize: 12, color: N.rose }}>Não consegui obter a localização — descreve a zona abaixo.</p>}
            <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ou descreve: junto ao Lidl de Faro, perto do parque…"
              style={{ ...FIELD, marginTop: 8 }} />
          </div>

          {/* Photo */}
          <div>
            <span style={LABEL}>Foto (se conseguires, de longe)</span>
            {photoPreview ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: `1px solid ${N.rule}` }} />
                <span style={{ fontSize: 13, color: uploading ? N.ink3 : N.emerald, fontFamily: N.mono }}>
                  {uploading ? 'a carregar…' : 'foto pronta ✓'}
                </span>
              </div>
            ) : (
              <label style={{ ...FIELD, cursor: 'pointer', color: N.ink3, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="photo" size={16} color={N.ink3} /> Tirar / escolher foto
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f) }} />
              </label>
            )}
          </div>

          <div>
            <span style={LABEL}>O que viste? (opcional)</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              placeholder="Estava sozinho, ia em direcção a…, parecia assustado…"
              style={{ ...FIELD, resize: 'none' }} />
          </div>

          <div>
            <span style={LABEL}>Contacto (privado, opcional)</span>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Telemóvel/email — só usado se for preciso"
              style={FIELD} />
          </div>

          {err && <p style={{ margin: 0, fontSize: 13, color: N.rose }}>{err}</p>}

          <Btn variant="primary" tone="ink" size="lg" full disabled={submitting || uploading} onClick={submit}
            icon={<Icon name="eye" size={16} color={N.paper} />}>
            {submitting ? 'a enviar…' : 'Enviar avistamento'}
          </Btn>
        </div>
      </div>
    </div>
  )
}
