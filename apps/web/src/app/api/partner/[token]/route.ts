import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// WS-G: partner panel data by panel_token (magic-link, no account). Returns the
// partner + the cases their community sourced (found_via_partner = intake_slug).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: partner } = await supabase
    .from('community_partners')
    .select('id, name, municipality, intake_slug')
    .eq('panel_token', token)
    .single()
  if (!partner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: cases } = await supabase
    .from('cases')
    .select('slug, dog_name, breed, type, status, last_seen_municipality, created_at, case_images(public_url, is_primary)')
    .eq('found_via_partner', partner.intake_slug as string)
    .order('created_at', { ascending: false })
    .limit(50)

  const shaped = (cases ?? []).map((c) => {
    const imgs = (c.case_images as Array<{ public_url: string | null; is_primary: boolean }>) ?? []
    return {
      slug: c.slug as string, dog_name: c.dog_name as string | null, breed: c.breed as string,
      type: c.type as string, status: c.status as string,
      municipality: c.last_seen_municipality as string,
      img: (imgs.find(i => i.is_primary) ?? imgs[0])?.public_url ?? null,
    }
  })

  return NextResponse.json({ partner, cases: shaped })
}
