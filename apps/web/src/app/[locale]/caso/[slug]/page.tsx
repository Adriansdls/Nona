import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CasePageClient } from './CasePageClient'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

interface CaseRow {
  id: string
  slug: string
  type: string
  status: string
  dog_name: string | null
  breed: string
  sex: string
  size: string
  primary_color: string
  secondary_color: string | null
  distinctive_marks: string[] | null
  age_estimate: string | null
  has_chip: boolean | null
  chip_last_3: string | null
  last_seen_at: string
  last_seen_municipality: string
  last_seen_zone_approx: string
  description: string
  context: string | null
  reporter_contact_public: string | null
  created_at: string
  resolved_at: string | null
}

interface CaseImage {
  id: string
  public_url: string | null
  is_primary: boolean
  quality_score: number | null
}

interface SightingRow {
  id: string
  seen_at: string
  zone_approx: string
  description: string | null
  is_public: boolean
}

async function getCaseData(slug: string) {
  const supabase = createServiceClient()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, sex, size,
      primary_color, secondary_color, distinctive_marks, age_estimate,
      has_chip, chip_last_3,
      last_seen_at, last_seen_municipality, last_seen_zone_approx,
      description, context, reporter_contact_public,
      created_at, resolved_at,
      case_images (id, public_url, is_primary, quality_score)
    `)
    .eq('slug', slug)
    .eq('sensitivity', 'publico')
    .single()

  if (error || !caseData) return null

  // Public sightings only
  const { data: sightings } = await supabase
    .from('sightings')
    .select('id, seen_at, zone_approx, description, is_public')
    .eq('case_id', caseData.id)
    .eq('is_public', true)
    .order('seen_at', { ascending: false })
    .limit(10)

  // Stats
  const [{ count: sightingCount }, { count: totalSightings }] = await Promise.all([
    supabase.from('sightings').select('*', { count: 'exact', head: true }).eq('case_id', caseData.id).eq('is_public', true),
    supabase.from('sightings').select('*', { count: 'exact', head: true }).eq('case_id', caseData.id),
  ])

  return {
    case: caseData as CaseRow & { case_images: CaseImage[] },
    sightings: (sightings ?? []) as SightingRow[],
    stats: {
      publicSightings: sightingCount ?? 0,
      totalSightings: totalSightings ?? 0,
    },
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getCaseData(slug)
  if (!data) return { title: 'Caso não encontrado' }
  const { case: c } = data
  const name = c.dog_name ?? c.breed
  return {
    title: `${name} — ${c.last_seen_municipality}`,
    description: `Cão ${c.type === 'perdido' ? 'perdido' : 'encontrado'} em ${c.last_seen_municipality}. Ajuda-nos a reunir ${name} com a sua família.`,
  }
}

export default async function CasoPage({ params }: PageProps) {
  const { locale, slug } = await params
  const data = await getCaseData(slug)
  if (!data) notFound()
  return <CasePageClient locale={locale} data={data}/>
}
