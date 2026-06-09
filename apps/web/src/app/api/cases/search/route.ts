import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  
  const status = searchParams.get('status') || 'ativo'
  const type = searchParams.get('type') || 'todos'
  const q = searchParams.get('q') || ''
  const municipality = searchParams.get('municipality') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '24', 10)

  const supabase = createServiceClient()
  
  // Start query construction. Always require public sensitivity.
  let query = supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, size, primary_color,
      last_seen_municipality, last_seen_at, created_at, resolved_at,
      case_images (public_url, is_primary)
    `, { count: 'exact' })
    .eq('sensitivity', 'publico')
    .order('created_at', { ascending: false })

  if (status !== 'todos') {
    query = query.eq('status', status)
  }

  if (type !== 'todos') {
    query = query.eq('type', type)
  }

  if (municipality) {
    query = query.eq('last_seen_municipality', municipality)
  }

  if (q) {
    const searchStr = `%${q}%`
    query = query.or(`dog_name.ilike.${searchStr},breed.ilike.${searchStr}`)
  }

  // Pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching catalogue cases:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    }
  })
}
