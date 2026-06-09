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

    // 1. Call ML service to get the embedding (this uses the temporary storage_path)
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

    // 2. Query Supabase for visually similar active cases
    // We pass a dummy exclude_case_id and a very old date to search all active cases.
    const DUMMY_UUID = '00000000-0000-0000-0000-000000000000'
    const SINCE_DATE = '2020-01-01T00:00:00Z'

    const { data: similarCases, error: searchError } = await supabase.rpc(
      'search_similar_cases',
      {
        query_embedding: embedding,
        exclude_case_id: DUMMY_UUID,
        since: SINCE_DATE,
        limit_count: 24, // Enough to fill a page grid
      }
    )

    if (searchError) {
      console.error('Vector search error:', searchError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    if (!similarCases || similarCases.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // 3. Fetch the full case details for the matching IDs
    const caseIds = similarCases.map((sc: { case_id: string; score: number }) => sc.case_id)

    const { data: casesData, error: fetchError } = await supabase
      .from('cases')
      .select(`
        id, slug, type, status, dog_name, breed, size, primary_color,
        last_seen_municipality, last_seen_at, created_at, resolved_at,
        case_images (public_url, is_primary)
      `)
      .in('id', caseIds)
      .eq('sensitivity', 'publico')

    if (fetchError) {
      console.error('Error fetching case details:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 })
    }

    // 4. Merge similarity scores and preserve ML ordering
    const finalData = similarCases
      .map((sc: { case_id: string; score: number }) => {
        const c = casesData?.find((c) => c.id === sc.case_id)
        if (!c) return null
        return { ...c, similarity_score: sc.score }
      })
      .filter(Boolean)

    return NextResponse.json({ data: finalData })

  } catch (error) {
    console.error('Unexpected error in visual search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
