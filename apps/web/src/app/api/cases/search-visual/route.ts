import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL

export async function POST(req: NextRequest) {
  if (!ML_SERVICE_URL) {
    return NextResponse.json({ error: 'ML service unavailable' }, { status: 503 })
  }

  try {
    const { storage_path } = await req.json()
    if (!storage_path) {
      return NextResponse.json({ error: 'storage_path is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Call ML service to get the embedding
    const mlRes = await fetch(`${ML_SERVICE_URL}/embed-only`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_path }),
    })

    if (!mlRes.ok) {
      const err = await mlRes.text()
      console.error('ML service error:', err)
      return NextResponse.json({ error: 'Failed to process image' }, { status: mlRes.status })
    }

    const { embedding } = await mlRes.json()

    // 2. Query Supabase for visually similar active cases AND classifieds concurrently
    const DUMMY_UUID = '00000000-0000-0000-0000-000000000000'
    const SINCE_DATE = '2020-01-01T00:00:00Z'

    const [casesSearch, classifiedsSearch] = await Promise.all([
      supabase.rpc('search_similar_cases', {
        query_embedding: embedding,
        exclude_case_id: DUMMY_UUID,
        since: SINCE_DATE,
        limit_count: 24,
      }),
      supabase.rpc('search_similar_classifieds', {
        query_embedding: embedding,
        since: SINCE_DATE,
        limit_count: 24,
      })
    ])

    if (casesSearch.error) console.error('Vector search error (cases):', casesSearch.error)
    if (classifiedsSearch.error) console.error('Vector search error (classifieds):', classifiedsSearch.error)

    const similarCases = casesSearch.data || []
    const similarClassifieds = classifiedsSearch.data || []

    if (similarCases.length === 0 && similarClassifieds.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // 3. Fetch the full case and listing details
    const caseIds = similarCases.map((sc: any) => sc.case_id)
    const listingIds = similarClassifieds.map((sc: any) => sc.listing_id)

    const [casesDataRes, classifiedsDataRes] = await Promise.all([
      caseIds.length > 0 
        ? supabase.from('cases').select(`
            id, slug, type, status, dog_name, breed, size, primary_color,
            last_seen_municipality, last_seen_at, created_at, resolved_at,
            case_images (public_url, is_primary)
          `).in('id', caseIds).eq('sensitivity', 'publico')
        : Promise.resolve({ data: [] }),
      
      listingIds.length > 0
        ? supabase.from('classified_listings').select(`
            id, title, price, location_raw, municipality, listing_url,
            breed_hint, size_hint, color_hint, scraped_at, is_active,
            classified_sources (name, display_name),
            classified_images (image_url)
          `).in('id', listingIds)
        : Promise.resolve({ data: [] })
    ])

    // 4. Merge and map into UnifiedCatalogueItem
    const unified: any[] = []

    similarCases.forEach((sc: any) => {
      const c = casesDataRes.data?.find((c) => c.id === sc.case_id)
      if (c) {
        unified.push({
          id: c.id,
          source: 'nona',
          type: c.type,
          status: c.status,
          name: c.dog_name,
          breed: c.breed,
          color: c.primary_color,
          municipality: c.last_seen_municipality,
          timestamp: c.created_at,
          url: `/caso/${c.slug}`,
          images: c.case_images || [],
          similarity_score: sc.score
        })
      }
    })

    similarClassifieds.forEach((sc: any) => {
      const c = classifiedsDataRes.data?.find((c) => c.id === sc.listing_id)
      if (c) {
        unified.push({
          id: c.id,
          source: 'classified',
          source_name: c.classified_sources?.display_name || 'Online',
          type: 'venda',
          status: c.is_active ? 'ativo' : 'removido',
          name: c.title,
          breed: c.breed_hint,
          color: c.color_hint,
          municipality: c.municipality || c.location_raw,
          timestamp: c.scraped_at,
          url: c.listing_url,
          images: c.classified_images ? c.classified_images.map((img: any) => ({ public_url: img.image_url })) : [],
          similarity_score: sc.score
        })
      }
    })

    // Sort globally by highest similarity score
    unified.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))

    return NextResponse.json({ data: unified.slice(0, 24) })

  } catch (error) {
    console.error('Unexpected error in visual search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
