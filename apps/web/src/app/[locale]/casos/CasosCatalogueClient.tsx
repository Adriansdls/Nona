'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { N } from '@/components/nona/tokens'
import { Icon } from '@/components/nona/Icon'
import type { UnifiedCatalogueItem } from '@/app/api/cases/search/route'

interface CatalogueClientProps {
  locale: string
  initialCases: UnifiedCatalogueItem[]
  initialTotal: number
}

export function CasosCatalogueClient({ locale, initialCases, initialTotal }: CatalogueClientProps) {
  const [cases, setCases] = useState<UnifiedCatalogueItem[]>(initialCases)
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
    if (isVisualSearch) return
    
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
      const formData = new FormData()
      formData.append('photo', file)
      
      const uploadRes = await fetch('/api/intake/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { path } = await uploadRes.json()

      const searchRes = await fetch('/api/cases/search-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: path }),
      })

      if (!searchRes.ok) throw new Error('Visual search failed')
      const { data } = await searchRes.json()
      
      setCases(data)
      setTotal(data.length)
      setHasMore(false)
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

  // Common input styles matching Nona design system
  const inputStyle = {
    width: '100%',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    border: `1px solid ${N.rule}`,
    borderRadius: 8,
    background: N.white,
    color: N.ink,
    fontSize: 14,
    fontFamily: N.sans,
    padding: '10px 14px',
    outline: 'none',
  }
  const labelStyle = {
    display: 'block',
    fontFamily: N.mono,
    fontSize: 10,
    color: N.ink3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    fontWeight: 600
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 40, flexDirection: 'row', flexWrap: 'wrap' }}>
      
      {/* Sidebar Filters */}
      <aside style={{ flex: '0 0 280px', width: '100%' }}>
        <h2 style={{ fontFamily: N.display, fontSize: 32, letterSpacing: '-0.02em', color: N.ink, margin: '0 0 24px' }}>
          {locale === 'en' ? 'Catalogue' : 'Catálogo'}
        </h2>
        
        <div style={{ background: N.surface, borderRadius: 16, border: `1px solid ${N.rule}`, padding: 24, display: 'grid', gap: 24 }}>
          
          {/* Visual Search */}
          <div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleVisualSearchUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: N.indigo, color: N.white, border: 'none', borderRadius: 10, padding: '12px 16px',
                fontSize: 14, fontWeight: 500, cursor: uploadingImage ? 'not-allowed' : 'pointer', fontFamily: N.sans,
                opacity: uploadingImage ? 0.7 : 1
              }}
            >
              <div style={{ width: 16, height: 16 }}><Icon name="camera" /></div>
              {uploadingImage ? (locale === 'en' ? 'Searching...' : 'A pesquisar...') : (locale === 'en' ? 'Search by Photo' : 'Pesquisar por Foto')}
            </button>
            {isVisualSearch && !uploadingImage && (
              <button onClick={clearVisualSearch} style={{ width: '100%', background: 'transparent', border: 'none', color: N.ink3, fontSize: 12, marginTop: 12, cursor: 'pointer', fontFamily: N.sans }}>
                {locale === 'en' ? 'Clear Visual Search' : 'Limpar pesquisa visual'}
              </button>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${N.rule}`, margin: 0 }} />

          {/* Status Filter */}
          <div style={{ opacity: isVisualSearch ? 0.5 : 1, pointerEvents: isVisualSearch ? 'none' : 'auto' }}>
            <label style={labelStyle}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={inputStyle}>
              <option value="ativo">{locale === 'en' ? 'Active Cases' : 'Casos Ativos'}</option>
              <option value="reunido">{locale === 'en' ? 'Reunited (Found)' : 'Reunidos (Finais)'}</option>
              <option value="todos">{locale === 'en' ? 'All' : 'Todos'}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ opacity: isVisualSearch ? 0.5 : 1, pointerEvents: isVisualSearch ? 'none' : 'auto' }}>
            <label style={labelStyle}>{locale === 'en' ? 'Type' : 'Tipo'}</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} style={inputStyle}>
              <option value="todos">{locale === 'en' ? 'All' : 'Todos'}</option>
              <option value="perdido">{locale === 'en' ? 'Missing Dogs' : 'Cães Perdidos'}</option>
              <option value="encontrado">{locale === 'en' ? 'Found Dogs' : 'Cães Encontrados'}</option>
            </select>
          </div>

          {/* Text Search */}
          <div style={{ opacity: isVisualSearch ? 0.5 : 1, pointerEvents: isVisualSearch ? 'none' : 'auto' }}>
            <label style={labelStyle}>{locale === 'en' ? 'Search terms' : 'Pesquisa livre'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'en' ? 'Name, breed, color, zone...' : 'Nome, raça, cor, zona...'}
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
              <div style={{ position: 'absolute', left: 12, top: 12, width: 14, height: 14, color: N.ink3 }}><Icon name="search" /></div>
            </div>
          </div>
          
        </div>
      </aside>

      {/* Main Grid */}
      <main style={{ flex: 1, minWidth: 0 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: N.ink3, fontFamily: N.sans }}>
            <strong style={{ color: N.ink }}>{total}</strong> {locale === 'en' ? 'cases found' : 'casos encontrados'}
            {isVisualSearch && (
              <span style={{ marginLeft: 8, color: N.indigo, fontWeight: 500 }}>
                (Visual Similarity Search)
              </span>
            )}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {cases.map((c) => {
            const imgArray = c.images as any[]
            const primaryImgUrl = imgArray?.find((i) => i.is_primary)?.public_url || imgArray?.[0]?.public_url
            
            const isNona = c.source === 'nona'
            const typeLabel = c.type === 'perdido' ? (locale === 'en' ? 'Missing' : 'Perdido') 
                            : c.type === 'encontrado' ? (locale === 'en' ? 'Found' : 'Encontrado')
                            : (locale === 'en' ? 'Online' : 'Anúncio Online')
            
            const statusLabel = c.status === 'reunido' ? (locale === 'en' ? 'Reunited 🎉' : 'Reunido 🎉') 
                              : c.status === 'removido' ? (locale === 'en' ? 'Removed' : 'Removido') : ''

            const CardWrapper = isNona ? Link : 'a'
            const wrapperProps = isNona 
              ? { href: c.url } 
              : { href: c.url, target: '_blank', rel: 'noopener noreferrer' }

            const typeColor = isNona 
              ? (c.type === 'perdido' ? { bg: N.roseBg, text: N.roseDeep } : { bg: N.amberBg, text: N.amber })
              : { bg: N.indigoBg, text: N.indigoDeep } // Blue for classifieds

            return (
              <CardWrapper
                key={c.id}
                {...wrapperProps as any}
                style={{ 
                  display: 'flex', flexDirection: 'column', background: N.white, 
                  border: `1px solid ${N.rule}`, borderRadius: 16, overflow: 'hidden', 
                  textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.03)`
                }}
              >
                {/* Image Section */}
                <div style={{ position: 'relative', aspectRatio: '1/1', background: N.surface }}>
                  {primaryImgUrl ? (
                    <img
                      src={primaryImgUrl}
                      alt={c.name ?? c.breed ?? 'Dog photo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: N.ink4, fontSize: 13, fontFamily: N.sans }}>
                      Sem foto
                    </div>
                  )}
                  
                  {/* Badges Overlay (Top Left) */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ 
                      background: typeColor.bg, color: typeColor.text, 
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: N.mono, 
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' 
                    }}>
                      {isNona ? typeLabel : c.source_name}
                    </span>
                    {statusLabel && (
                      <span style={{ 
                        background: N.emeraldBg, color: N.emeraldDeep, 
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: N.mono, 
                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' 
                      }}>
                        {statusLabel}
                      </span>
                    )}
                  </div>

                  {/* Match Score (Top Right) */}
                  {c.similarity_score && (
                    <div style={{ 
                      position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: N.white, 
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: N.mono, 
                      fontWeight: 600, backdropFilter: 'blur(4px)'
                    }}>
                      {Math.round(c.similarity_score * 100)}% Match
                    </div>
                  )}
                  
                  {/* External link indicator */}
                  {!isNona && (
                    <div style={{ 
                      position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, 
                      background: 'rgba(0,0,0,0.6)', color: N.white, borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' 
                    }}>
                      <div style={{ width: 12, height: 12 }}><Icon name="arrowUp" /></div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontFamily: N.display, fontSize: 18, color: N.ink, margin: '0 0 6px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name ?? c.breed ?? 'Desconhecido'}
                  </h3>
                  
                  {(c.breed || c.color) && (
                    <div style={{ fontSize: 12, color: N.ink3, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: N.sans }}>
                      {[c.breed, c.color].filter(Boolean).join(' · ')}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: N.ink3, display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', marginBottom: 12, fontFamily: N.sans }}>
                    <div style={{ width: 12, height: 12, flexShrink: 0 }}><Icon name="pin" /></div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.municipality || 'Localização desconhecida'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: 11, color: N.ink4, fontFamily: N.mono }}>
                    {new Date(c.timestamp).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-PT')}
                  </div>
                </div>
              </CardWrapper>
            )
          })}
        </div>

        {cases.length === 0 && !loading && (
          <div style={{ padding: '80px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, color: N.ink4, marginBottom: 16 }}><Icon name="search" /></div>
            <p style={{ color: N.ink3, fontSize: 15, fontFamily: N.sans }}>
              {locale === 'en' ? 'No dogs found matching your criteria.' : 'Nenhum cão encontrado com estes critérios.'}
            </p>
          </div>
        )}

        {hasMore && !isVisualSearch && (
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                background: N.white, border: `1px solid ${N.rule}`, color: N.ink, 
                padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 500, 
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: N.sans,
                opacity: loading ? 0.6 : 1, transition: 'background 0.2s'
              }}
            >
              {loading ? (locale === 'en' ? 'Loading...' : 'A carregar...') : (locale === 'en' ? 'Load More' : 'Carregar Mais')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
