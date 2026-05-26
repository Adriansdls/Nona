import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { generateDossierPDF } from '@/lib/posters/generate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const full = req.nextUrl.searchParams.get('full') === 'true'
  const service = createServiceClient()

  const { data: caseRow, error } = await service
    .from('cases')
    .select('*, case_images(*), sightings(municipality, zone_approx, seen_at, description, is_public)')
    .eq('id', id)
    .single()

  if (error || !caseRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (full) {
    const { data: profile } = await service
      .from('user_profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'asociacion'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const pdfBuffer = await generateDossierPDF(caseRow, { includePrivate: full })
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dossier-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Dossier generation error:', e)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
