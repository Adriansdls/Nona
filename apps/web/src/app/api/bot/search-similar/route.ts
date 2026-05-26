/**
 * ML-powered similarity search for the bot's avistamento flow.
 *
 * Takes a staged photo path, gets its embedding from the ML service,
 * then searches all active perdido cases by vector similarity.
 * Returns the top matches with enough case detail for Claude to reason about.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function checkInternalToken(req: NextRequest): boolean {
  const token = req.headers.get('x-internal-token')
  return !!token && token === process.env['INTERNAL_API_TOKEN']
}

interface SimilarCaseMatch {
  caseId: string
  slug: string
  similarityScore: number
  dogName: string | null
  breed: string
  primaryColor: string
  secondaryColor: string | null
  distinctiveMarks: string[]
  lastSeenMunicipality: string
  lastSeenZoneApprox: string
  lastSeenAt: string
  description: string
  primaryImageUrl: string | null
  daysMissing: number
}

export async function POST(req: NextRequest) {
  if (!checkInternalToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { stagedPhotoPath: string; limit?: number }
  if (!body.stagedPhotoPath) {
    return NextResponse.json({ error: 'stagedPhotoPath required' }, { status: 400 })
  }

  const mlUrl = process.env['ML_SERVICE_URL']
  if (!mlUrl) {
    return NextResponse.json({ error: 'ML service not configured' }, { status: 503 })
  }

  // Get embedding for the staged photo via ML service
  let embedding: number[]
  try {
    // We need a temporary case_image_id — use a placeholder since we're not inserting
    const mlRes = await fetch(`${mlUrl}/embed-only`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_path: body.stagedPhotoPath }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!mlRes.ok) {
      // ML service might not have /embed-only yet — fall back to text search only
      return NextResponse.json({ data: [], fallback: true })
    }

    const mlData = (await mlRes.json()) as { embedding: number[] }
    embedding = mlData.embedding
  } catch {
    // ML unavailable — return empty, Claude will create an encontrado case
    return NextResponse.json({ data: [], fallback: true })
  }

  const supabase = createServiceClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const limit = body.limit ?? 5

  const { data: candidates, error } = await supabase.rpc('search_similar_cases', {
    query_embedding: `[${embedding.join(',')}]`,
    exclude_case_id: '00000000-0000-0000-0000-000000000000',
    since,
    limit_count: limit * 3, // fetch more, filter to perdido below
  })

  if (error || !candidates?.length) {
    return NextResponse.json({ data: [] })
  }

  // Fetch full case details for top candidates
  const candidateIds = (candidates as Array<{ case_id: string; score: number }>)
    .filter((c) => c.score > 0.45) // loose threshold — Claude decides
    .slice(0, limit)
    .map((c) => c.case_id)

  if (!candidateIds.length) {
    return NextResponse.json({ data: [] })
  }

  const { data: cases } = await supabase
    .from('cases')
    .select(`
      id, slug, type, dog_name, breed, primary_color, secondary_color,
      distinctive_marks, last_seen_municipality, last_seen_zone_approx,
      last_seen_at, description, created_at,
      case_images(public_url, is_primary)
    `)
    .in('id', candidateIds)
    .eq('type', 'perdido')
    .eq('status', 'ativo')

  if (!cases?.length) {
    return NextResponse.json({ data: [] })
  }

  // Merge similarity scores back in and shape the response
  const scoreMap = new Map(
    (candidates as Array<{ case_id: string; score: number }>).map((c) => [c.case_id, c.score])
  )

  const results: SimilarCaseMatch[] = cases.map((c) => {
    const images = (c.case_images as Array<{ public_url: string; is_primary: boolean }>) ?? []
    const primary = images.find((i) => i.is_primary) ?? images[0]
    const daysMissing = Math.floor(
      (Date.now() - new Date(c.created_at as string).getTime()) / 86_400_000
    )

    return {
      caseId: c.id as string,
      slug: c.slug as string,
      similarityScore: Math.round((scoreMap.get(c.id as string) ?? 0) * 100),
      dogName: (c.dog_name as string | null) ?? null,
      breed: c.breed as string,
      primaryColor: c.primary_color as string,
      secondaryColor: (c.secondary_color as string | null) ?? null,
      distinctiveMarks: (c.distinctive_marks as string[]) ?? [],
      lastSeenMunicipality: c.last_seen_municipality as string,
      lastSeenZoneApprox: c.last_seen_zone_approx as string,
      lastSeenAt: c.last_seen_at as string,
      description: c.description as string,
      primaryImageUrl: primary?.public_url ?? null,
      daysMissing,
    }
  })

  results.sort((a, b) => b.similarityScore - a.similarityScore)

  return NextResponse.json({ data: results })
}
