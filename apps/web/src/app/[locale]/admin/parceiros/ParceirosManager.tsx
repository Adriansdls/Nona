'use client'
import { useState } from 'react'

type Partner = {
  id: string; name: string; municipality: string | null; contact: string | null
  intake_slug: string; panel_token: string; created_at: string
}

export function ParceirosManager({ locale, appUrl, initial }: { locale: string; appUrl: string; initial: Partner[] }) {
  const [partners, setPartners] = useState<Partner[]>(initial)
  const [name, setName] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [contact, setContact] = useState('')
  const [creating, setCreating] = useState(false)

  async function create() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, municipality, contact }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setPartners(prev => [data, ...prev])
        setName(''); setMunicipality(''); setContact('')
      }
    } finally { setCreating(false) }
  }

  const pub = (p: Partner) => `${appUrl}/${locale}/vi-um-cao?p=${p.intake_slug}`
  const panel = (p: Partner) => `${appUrl}/${locale}/parceiro/${p.panel_token}`
  const copy = (s: string) => navigator.clipboard?.writeText(s)

  return (
    <div>
      <div className="border rounded-lg p-4 mb-6 bg-muted/20 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-muted-foreground mb-1">Nome do grupo/associação</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Cães Perdidos Algarve" />
        </div>
        <div className="w-40">
          <label className="block text-xs text-muted-foreground mb-1">Concelho</label>
          <input value={municipality} onChange={e => setMunicipality(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Loulé" />
        </div>
        <div className="w-48">
          <label className="block text-xs text-muted-foreground mb-1">Contacto</label>
          <input value={contact} onChange={e => setContact(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="email / telefone" />
        </div>
        <button onClick={create} disabled={!name.trim() || creating} className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50">
          {creating ? 'A criar…' : 'Criar parceiro'}
        </button>
      </div>

      <div className="space-y-3">
        {partners.map(p => (
          <div key={p.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{p.name}{p.municipality ? ` · ${p.municipality}` : ''}</div>
              {p.contact && <span className="text-xs text-muted-foreground">{p.contact}</span>}
            </div>
            <div className="grid gap-2 text-sm">
              <LinkRow label="Link público (fixar no grupo)" url={pub(p)} onCopy={() => copy(pub(p))} />
              <LinkRow label="Painel privado (para o admin)" url={panel(p)} onCopy={() => copy(panel(p))} />
            </div>
          </div>
        ))}
        {partners.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há parceiros.</p>}
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
      <button onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="px-3 py-1.5 rounded-md border text-xs font-medium shrink-0">
        {copied ? 'copiado ✓' : 'copiar'}
      </button>
    </div>
  )
}
