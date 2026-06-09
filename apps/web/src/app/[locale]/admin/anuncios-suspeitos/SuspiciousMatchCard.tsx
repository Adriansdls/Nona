'use client'

import { useState } from 'react'

interface ClassifiedImage {
  id: string
  image_url: string
  storage_path: string | null
}

interface ClassifiedListing {
  id: string
  title: string | null
  price: string | null
  location_raw: string | null
  municipality: string | null
  listing_url: string
  description: string | null
  breed_hint: string | null
  size_hint: string | null
  color_hint: string | null
  posted_at: string | null
  scraped_at: string | null
  classified_images: ClassifiedImage[]
  classified_sources: { name: string; display_name: string } | null
}

interface CaseImage {
  public_url: string | null
  is_primary: boolean
}

interface MatchCase {
  id: string
  slug: string
  dog_name: string | null
  breed: string | null
  primary_color: string | null
  last_seen_municipality: string | null
  last_seen_at: string
  case_images: CaseImage[]
}

interface SuspiciousMatch {
  id: string
  similarity_score: number
  priority: string
  status: string
  created_at: string
  notes: string | null
  classified_listing: ClassifiedListing
  case: MatchCase
}

interface Props {
  match: SuspiciousMatch
  locale: string
}

export function SuspiciousMatchCard({ match, locale }: Props) {
  const [status, setStatus] = useState(match.status)
  const [loading, setLoading] = useState(false)

  const listing = match.classified_listing
  const case_ = match.case
  const score = Math.round(match.similarity_score * 100)
  const listingImg = listing.classified_images?.[0]?.image_url
  const caseImg = case_.case_images?.find((img: CaseImage) => img.is_primary)?.public_url
    || case_.case_images?.[0]?.public_url

  const formatDate = (d: string | null) => {
    if (!d) return '?'
    return new Date(d).toLocaleDateString('pt-PT')
  }

  const handleAction = async (action: 'confirmado' | 'rejeitado') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suspicious-matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (res.ok) {
        setStatus(action)
      }
    } finally {
      setLoading(false)
    }
  }

  const isHigh = match.priority === 'high'

  return (
    <div className={`border rounded-xl p-4 ${
      status === 'confirmado' ? 'border-green-300 bg-green-50' :
      status === 'rejeitado' ? 'border-muted bg-muted/20 opacity-60' :
      isHigh ? 'border-red-300 bg-red-50' :
      'border-border'
    }`}>
      {/* Priority badge + score */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center shrink-0 ${
          isHigh ? 'border-red-400' : 'border-yellow-400'
        }`}>
          <span className={`text-lg font-bold ${isHigh ? 'text-red-600' : 'text-yellow-600'}`}>
            {score}%
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Semelhança visual
            </span>
            {isHigh && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                ALTA
              </span>
            )}
            {match.priority === 'medium' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                MÉDIA
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Criado: {formatDate(match.created_at)}
            {listing.classified_sources?.display_name && (
              <span className="ml-2">· Fonte: {listing.classified_sources.display_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Classified listing */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Anúncio suspeito
          </div>
          {listingImg && (
            <img
              src={listingImg}
              alt="Listing"
              className="w-full h-40 object-cover rounded-lg border"
            />
          )}
          <div className="text-sm font-medium">{listing.title || 'Sem título'}</div>
          {listing.price && (
            <div className="text-sm text-muted-foreground">{listing.price}</div>
          )}
          <div className="text-xs text-muted-foreground">
            {listing.location_raw || listing.municipality || 'Localização desconhecida'}
          </div>
          {listing.breed_hint && (
            <div className="text-xs">Raça: <span className="font-medium">{listing.breed_hint}</span></div>
          )}
          {listing.color_hint && (
            <div className="text-xs">Cor: <span className="font-medium">{listing.color_hint}</span></div>
          )}
          {listing.size_hint && (
            <div className="text-xs">Porte: <span className="font-medium">{listing.size_hint}</span></div>
          )}
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Ver anúncio original ↗
          </a>
        </div>

        {/* Lost dog case */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Cão perdido
          </div>
          {caseImg && (
            <img
              src={caseImg}
              alt="Lost dog"
              className="w-full h-40 object-cover rounded-lg border"
            />
          )}
          <div className="text-sm font-medium">{case_.dog_name || 'Sem nome'}</div>
          <div className="text-sm text-muted-foreground">{case_.breed}</div>
          <div className="text-xs text-muted-foreground">
            {case_.primary_color} · {case_.last_seen_municipality}
          </div>
          <div className="text-xs text-muted-foreground">
            Desaparecido: {formatDate(case_.last_seen_at)}
          </div>
          <a
            href={`/${locale}/caso/${case_.slug}`}
            className="text-xs text-primary hover:underline"
          >
            Ver caso ↗
          </a>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mb-3 line-clamp-3">
          {listing.description}
        </div>
      )}

      {/* Actions */}
      {status === 'pendente' && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('confirmado')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Confirmar correspondência
          </button>
          <button
            onClick={() => handleAction('rejeitado')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Rejeitar
          </button>
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded-lg text-sm hover:bg-accent"
          >
            Ver anúncio original
          </a>
        </div>
      )}

      {status !== 'pendente' && (
        <div className={`text-xs font-medium ${
          status === 'confirmado' ? 'text-green-700' : 'text-muted-foreground'
        }`}>
          {status === 'confirmado' ? '✓ Correspondência confirmada' : '✗ Rejeitado'}
        </div>
      )}
    </div>
  )
}