'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { N } from '@/components/nona/tokens'
import { Icon } from '@/components/nona/Icon'

export interface CaseRecord {
  id: string
  slug: string
  type: 'perdido' | 'encontrado'
  status: 'ativo' | 'reunido'
  dog_name: string | null
  breed: string
  size: string
  primary_color: string
  last_seen_municipality: string
  last_seen_at: string
  created_at: string
  case_images: Array<{ public_url: string | null; is_primary: boolean }>
  similarity_score?: number
}

interface CatalogueClientProps {
  locale: string
  initialCases: CaseRecord[]
  initialTotal: number
}

export function CasosCatalogueClient({ locale, initialCases, initialTotal }: CatalogueClientProps) {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialTotal > initialCases.length)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'reunido' | 'todos'>('ativo')
  const [typeFilter, setTypeFilter] = useState<'perdido' | 'encontrado' | 'todos'>('todos')
  const [municipalityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Visual Search
  const [isVisualSearch, setIsVisualSearch] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCases = async (pageNum = 1, append = false) => {
    if (isVisualSearch) return // Do not run text-based pagination if visual search is active
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '24',
        status: statusFilter,
        type: typeFilter,
      })
      if (municipalityFilter) params.append('municipality', municipalityFilter)
      if (searchQuery) params.append('q', searchQuery)

      const res = await fetch(`/api/cases/search?${params.toString()}`)
      if (res.ok) {
        const { data, meta } = await res.json()
        setCases(append ? (prev) => [...prev, ...data] : data)
        setTotal(meta.total)
        setHasMore(meta.page < meta.totalPages)
        setPage(pageNum)
      }
    } catch (e) {
      console.error('Failed to fetch cases:', e)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on filter change
  useEffect(() => {
    if (isVisualSearch) return
    const timer = setTimeout(() => {
      fetchCases(1, false)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, municipalityFilter, searchQuery, isVisualSearch])

  const handleLoadMore = () => {
    fetchCases(page + 1, true)
  }

  const handleVisualSearchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setIsVisualSearch(true)
    setCases([])
    
    try {
      // 1. Upload to staging
      const formData = new FormData()
      formData.append('photo', file)
      
      const uploadRes = await fetch('/api/intake/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { path } = await uploadRes.json()

      // 2. Request visual similarity search
      const searchRes = await fetch('/api/cases/search-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: path }),
      })

      if (!searchRes.ok) throw new Error('Visual search failed')
      const { data } = await searchRes.json()
      
      setCases(data)
      setTotal(data.length)
      setHasMore(false) // Visual search returns a single fixed batch
    } catch (err) {
      console.error(err)
      alert(locale === 'en' ? 'Error performing visual search.' : 'Erro na pesquisa visual.')
      clearVisualSearch()
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearVisualSearch = () => {
    setIsVisualSearch(false)
    setSearchQuery('')
    fetchCases(1, false)
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar / Filters */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: N.display }}>
            {locale === 'en' ? 'Catalogue' : 'Catálogo'}
          </h2>
          
          <div className="bg-surface rounded-xl p-5 border border-border space-y-5">
            {/* Visual Search Button */}
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleVisualSearchUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{ background: N.indigo, color: N.white }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <div className="w-4 h-4"><Icon name="camera" /></div>
                {uploadingImage ? (locale === 'en' ? 'Searching...' : 'A pesquisar...') : (locale === 'en' ? 'Search by Photo' : 'Pesquisar por Foto')}
              </button>
              {isVisualSearch && !uploadingImage && (
                <button
                  onClick={clearVisualSearch}
                  className="w-full mt-2 text-xs text-center text-muted-foreground hover:text-foreground"
                >
                  {locale === 'en' ? 'Clear Visual Search' : 'Limpar pesquisa visual'}
                </button>
              )}
            </div>

            <hr className="border-border" />

            {/* Status Filter */}
            <div className={`space-y-2 ${isVisualSearch ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ativo' | 'reunido' | 'todos')}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="ativo">{locale === 'en' ? 'Active Cases' : 'Casos Ativos'}</option>
                <option value="reunido">{locale === 'en' ? 'Reunited (Found)' : 'Reunidos (Finais)'}</option>
                <option value="todos">{locale === 'en' ? 'All' : 'Todos'}</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className={`space-y-2 ${isVisualSearch ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === 'en' ? 'Type' : 'Tipo'}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'perdido' | 'encontrado' | 'todos')}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="todos">{locale === 'en' ? 'All' : 'Todos'}</option>
                <option value="perdido">{locale === 'en' ? 'Missing Dogs' : 'Cães Perdidos'}</option>
                <option value="encontrado">{locale === 'en' ? 'Found Dogs' : 'Cães Encontrados'}</option>
              </select>
            </div>

            {/* Text Search */}
            <div className={`space-y-2 ${isVisualSearch ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === 'en' ? 'Search terms' : 'Pesquisa livre'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'en' ? 'Name, breed, zone...' : 'Nome, raça, zona...'}
                  className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-background"
                />
                <div className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"><Icon name="search" /></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Grid */}
      <main className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} {locale === 'en' ? 'cases found' : 'casos encontrados'}
            {isVisualSearch && (
              <span className="ml-2 font-medium" style={{ color: N.indigo }}>
                (Visual Similarity Search)
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cases.map((c) => {
            const primaryImg = c.case_images?.find((i) => i.is_primary) || c.case_images?.[0]
            const typeLabel = c.type === 'perdido' ? (locale === 'en' ? 'Missing' : 'Perdido') : (locale === 'en' ? 'Found' : 'Encontrado')
            const statusLabel = c.status === 'reunido' ? (locale === 'en' ? 'Reunited 🎉' : 'Reunido 🎉') : ''

            return (
              <Link
                key={c.id}
                href={`/${locale}/caso/${c.slug}`}
                className="group flex flex-col bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-square bg-muted">
                  {primaryImg?.public_url ? (
                    <img
                      src={primaryImg.public_url}
                      alt={c.dog_name ?? c.breed}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sem foto
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md ${
                      c.type === 'perdido' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {typeLabel}
                    </span>
                    {statusLabel && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-emerald-100 text-emerald-700">
                        {statusLabel}
                      </span>
                    )}
                  </div>
                  {c.similarity_score && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 text-white backdrop-blur-sm">
                      {Math.round(c.similarity_score * 100)}% Match
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm line-clamp-1 mb-1" style={{ fontFamily: N.display }}>
                    {c.dog_name ?? c.breed}
                  </h3>
                  <div className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                    <div className="w-3 h-3"><Icon name="pin" /></div>
                    <span className="line-clamp-1">{c.last_seen_municipality}</span>
                  </div>
                  <div className="mt-auto text-[10px] text-muted-foreground font-mono">
                    {new Date(c.last_seen_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT')}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {cases.length === 0 && !loading && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 text-muted-foreground mb-4 opacity-50"><Icon name="search" /></div>
            <p className="text-muted-foreground">
              {locale === 'en' ? 'No cases found matching your criteria.' : 'Nenhum caso encontrado com estes critérios.'}
            </p>
          </div>
        )}

        {hasMore && !isVisualSearch && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2 border border-border rounded-full text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {loading ? (locale === 'en' ? 'Loading...' : 'A carregar...') : (locale === 'en' ? 'Load More' : 'Carregar Mais')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
