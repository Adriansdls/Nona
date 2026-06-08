'use client'
import { useState } from 'react'

type Clinic = {
  id: string
  name: string
  municipality: string | null
  vet_license: string | null
  contact_email: string | null
  contact_phone: string | null
  is_approved: boolean
  intake_slug: string
  panel_token: string
  created_at: string
}

export function ClinicasManager({ locale, appUrl, initial }: { locale: string; appUrl: string; initial: Clinic[] }) {
  const [clinics, setClinics] = useState<Clinic[]>(initial)
  const [name, setName] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [vetLicense, setVetLicense] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactTelegramId, setContactTelegramId] = useState('')
  const [creating, setCreating] = useState(false)

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, municipality, vet_license: vetLicense, contact_email: contactEmail, contact_phone: contactPhone, contact_telegram_id: contactTelegramId }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setClinics(prev => [data, ...prev])
        setName('')
        setMunicipality('')
        setVetLicense('')
        setContactEmail('')
        setContactPhone('')
        setContactTelegramId('')
      }
    } finally { setCreating(false) }
  }

  async function approve(id: string, approved: boolean) {
    await fetch(`/api/admin/clinics`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_approved: approved }) })
    setClinics(prev => prev.map(c => c.id === id ? { ...c, is_approved: approved } : c))
  }

  const pub = (c: Clinic) => `${appUrl}/${locale}/clinica/${c.intake_slug}`
  const panel = (c: Clinic) => `${appUrl}/${locale}/clinica/painel/${c.panel_token}`
  const copy = (s: string) => navigator.clipboard?.writeText(s)

  return (
    <div>
      <div className="border rounded-lg p-4 mb-6 bg-muted/20 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-muted-foreground mb-1">Nome da clínica</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Clínica Veterinária Faro" />
        </div>
        <div className="w-40">
          <label className="block text-xs text-muted-foreground mb-1">Concelho</label>
          <input value={municipality} onChange={e => setMunicipality(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Faro" />
        </div>
        <div className="w-40">
          <label className="block text-xs text-muted-foreground mb-1">Lic. Veterinária</label>
          <input value={vetLicense} onChange={e => setVetLicense(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="12345" />
        </div>
        <div className="w-48">
          <label className="block text-xs text-muted-foreground mb-1">Email</label>
          <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="clinica@exemplo.pt" />
        </div>
        <div className="w-40">
          <label className="block text-xs text-muted-foreground mb-1">Telefone</label>
          <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="+351 912345678" />
        </div>
        <div className="w-48">
          <label className="block text-xs text-muted-foreground mb-1">Telegram ID</label>
          <input value={contactTelegramId} onChange={e => setContactTelegramId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="123456789" />
        </div>
        <button onClick={create} disabled={!name.trim() || creating} className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50">
          {creating ? 'A criar…' : 'Criar clínica'}
        </button>
      </div>

      <div className="space-y-3">
        {clinics.map(c => (
          <div key={c.id} className={`border rounded-lg p-4 ${c.is_approved ? '' : 'bg-amber-50/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{c.name}</div>
                {c.municipality && <span className="text-xs text-muted-foreground">{c.municipality}</span>}
                {c.vet_license && <span className="text-xs text-muted-foreground">· Lic. {c.vet_license}</span>}
                {!c.is_approved && <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Pendente</span>}
              </div>
              <div className="flex items-center gap-2">
                {c.contact_email && <span className="text-xs text-muted-foreground">{c.contact_email}</span>}
                {c.contact_phone && <span className="text-xs text-muted-foreground">{c.contact_phone}</span>}
              </div>
            </div>
            <div className="grid gap-2 text-sm mb-3">
              <LinkRow label="Link público (fixar na receção)" url={pub(c)} onCopy={() => copy(pub(c))} />
              <LinkRow label="Painel privado" url={panel(c)} onCopy={() => copy(panel(c))} />
            </div>
            {!c.is_approved && (
              <button onClick={() => approve(c.id, true)} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-medium">
                Aprovar clínica
              </button>
            )}
            {c.is_approved && (
              <button onClick={() => approve(c.id, false)} className="px-3 py-1.5 rounded-md border text-muted-foreground text-xs font-medium">
                Suspender
              </button>
            )}
          </div>
        ))}
        {clinics.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há clínicas parceiras.</p>}
      </div>
    </div>
  )
}

function LinkRow({ label, url, onCopy }: { label: string; url: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-xs truncate">{url}</div>
      </div>
      <button onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="px-3 py-1.5 rounded-md border text-xs font-medium shrink-0">
        {copied ? 'copiado ✓' : 'copiar'}
      </button>
    </div>
  )
}
