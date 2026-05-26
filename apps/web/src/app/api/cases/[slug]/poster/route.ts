import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generatePosterA4 } from '@/lib/posters/generate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const locale = (req.nextUrl.searchParams.get('locale') ?? 'pt') as 'pt' | 'en' | 'es'

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, sex, size,
      primary_color, secondary_color, distinctive_marks, age_estimate,
      has_chip, chip_last_3, last_seen_at, last_seen_municipality,
      last_seen_zone_approx, description, reporter_contact_public,
      created_at, resolved_at,
      case_images (id, public_url, is_primary)
    `)
    .eq('slug', slug)
    .eq('status', 'ativo')
    .eq('sensitivity', 'publico')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await generatePosterA4(data as Parameters<typeof generatePosterA4>[0], locale)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="salvacao-${slug}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Poster generation error:', e)
    return NextResponse.json({ error: 'Poster generation failed' }, { status: 500 })
  }
}
