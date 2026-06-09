import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface UnifiedCatalogueItem {
  id: string
  source: 'nona' | 'classified'
  source_name?: string
  type: string
  status: string
  name: string | null
  breed: string | null
  color: string | null
  municipality: string | null
  timestamp: string
  url: string
  images: Array<{ public_url: string | null }>
  similarity_score?: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  
  const status = searchParams.get('status') || 'ativo'
  const type = searchParams.get('type') || 'todos'
  const q = searchParams.get('q') || ''
  const municipality = searchParams.get('municipality') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '24', 10)

  const supabase = createServiceClient()
  
  // ==========================================
  // 1. Query Nona Cases
  // ==========================================
  let casesQuery = supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, size, primary_color,
      last_seen_municipality, last_seen_at, created_at, resolved_at,
      case_images (public_url, is_primary)
    `, { count: 'exact' })
    .eq('sensitivity', 'publico')
    .order('created_at', { ascending: false })

  if (status !== 'todos') casesQuery = casesQuery.eq('status', status)
  if (type !== 'todos') casesQuery = casesQuery.eq('type', type)
  if (municipality) casesQuery = casesQuery.eq('last_seen_municipality', municipality)
  if (q) {
    const searchStr = `%${q}%`
    casesQuery = casesQuery.or(`dog_name.ilike.${searchStr},breed.ilike.${searchStr}`)
  }
  
  // Fetch slightly more than needed to ensure we have enough after merging
  casesQuery = casesQuery.range((page - 1) * limit, (page * limit) - 1)

  // ==========================================
  // 2. Query Classifieds (OLX, etc)
  // ==========================================
  // Only query classifieds if type matches or is 'todos'
  const fetchClassifieds = type === 'todos' || type === 'encontrado' || type === 'venda'
  let classifiedsQuery = supabase
    .from('classified_listings')
    .select(`
      id, title, price, location_raw, municipality, listing_url,
      breed_hint, size_hint, color_hint, scraped_at, is_active,
      classified_sources (name, display_name),
      classified_images (image_url)
    `, { count: 'exact' })
    .eq('is_dog', true)
    .order('scraped_at', { ascending: false })

  if (status === 'ativo') classifiedsQuery = classifiedsQuery.eq('is_active', true)
  if (status === 'reunido') classifiedsQuery = classifiedsQuery.eq('is_active', false)
  if (municipality) classifiedsQuery = classifiedsQuery.eq('municipality', municipality)
  if (q) {
    const searchStr = `%${q}%`
    classifiedsQuery = classifiedsQuery.or(`title.ilike.${searchStr},breed_hint.ilike.${searchStr},color_hint.ilike.${searchStr}`)
  }
  
  classifiedsQuery = classifiedsQuery.range((page - 1) * limit, (page * limit) - 1)

  // ==========================================
  // 3. Execute concurrently
  // ==========================================
  const [casesRes, classifiedsRes] = await Promise.all([
    casesQuery,
    fetchClassifieds ? classifiedsQuery : Promise.resolve({ data: [], count: 0, error: null })
  ])

  if (casesRes.error) console.error('Error fetching cases:', casesRes.error)
  if (classifiedsRes.error) console.error('Error fetching classifieds:', classifiedsRes.error)

  const unified: UnifiedCatalogueItem[] = []

  // Map Cases
  if (casesRes.data) {
    for (const c of casesRes.data) {
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
      })
    }
  }

  // Map Classifieds
  if (classifiedsRes.data) {
    for (const c of classifiedsRes.data as any[]) {
      unified.push({
        id: c.id,
        source: 'classified',
        source_name: c.classified_sources?.display_name || 'Online',
        type: 'venda', // Most OLX/CustoJusto listings are sales/adoption
        status: c.is_active ? 'ativo' : 'removido',
        name: c.title,
        breed: c.breed_hint,
        color: c.color_hint,
        municipality: c.municipality || c.location_raw,
        timestamp: c.scraped_at,
        url: c.listing_url,
        images: c.classified_images ? c.classified_images.map((img: any) => ({ public_url: img.image_url })) : [],
      })
    }
  }

  // Sort unified array by timestamp descending
  unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Slice to the requested limit (since we fetched up to 'limit' from BOTH sources)
  const finalData = unified.slice(0, limit)
  const totalCount = (casesRes.count || 0) + (classifiedsRes.count || 0)

  return NextResponse.json({
    data: finalData,
    meta: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  })
}
