import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripPrivateFields } from '@/lib/privacy'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, slug, type, status, sensitivity,
      dog_name, breed, sex, neutered, size,
      primary_color, secondary_color, distinctive_marks, age_estimate,
      has_chip, chip_last_3,
      last_seen_at, last_seen_municipality, last_seen_zone_approx,
      description, reporter_contact_public,
      created_at, resolved_at,
      case_images (
        id, public_url, is_primary, image_type
      )
    `)
    .eq('slug', slug)
    .eq('status', 'ativo')
    .eq('sensitivity', 'publico')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  const safe = stripPrivateFields(data as Record<string, unknown>)
  return NextResponse.json({ data: safe })
}
