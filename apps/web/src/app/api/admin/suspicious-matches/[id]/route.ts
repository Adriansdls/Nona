import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  }

  if (!['confirmado', 'rejeitado'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status. Must be confirmado or rejeitado.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('suspicious_matches')
    .update({ status })
    .eq('id', id)
    .select('id, classified_listing_id, case_id, similarity_score, priority')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (status === 'confirmado' && data) {
    const caseRes = await supabase
      .from('cases')
      .select('id, dog_name, slug')
      .eq('id', data.case_id)
      .single()

    if (caseRes.data) {
      await supabase
        .from('cases')
        .update({ suspected_theft: true })
        .eq('id', data.case_id)
        .eq('suspected_theft', false)
    }

    console.log(
      `[suspicious-match] Confirmed: case=${data.case_id?.slice(0, 8)} listing=${data.classified_listing_id?.slice(0, 8)} score=${(data.similarity_score * 100).toFixed(0)}%`
    )
  }

  return NextResponse.json({ data })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('suspicious_matches')
    .select(`
      id, similarity_score, priority, status, created_at, notes,
      classified_listing:classified_listing_id (
        id, title, price, location_raw, municipality, listing_url, description,
        breed_hint, size_hint, color_hint, image_urls,
        classified_images (id, image_url, storage_path),
        classified_sources:name, display_name
      ),
      case:case_id (
        id, slug, dog_name, breed, primary_color, last_seen_municipality,
        case_images (public_url, is_primary)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ data })
}