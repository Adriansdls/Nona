import { createServiceClient } from '@/lib/supabase/service'
import { CasosCatalogueClient } from './CasosCatalogueClient'
import type { UnifiedCatalogueItem } from '@/app/api/cases/search/route'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function CasosPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = createServiceClient()
  
  // Initial SSR fetch for fast first paint and SEO (combining both sources, just like the API)
  const [casesRes, classifiedsRes] = await Promise.all([
    supabase
      .from('cases')
      .select(`
        id, slug, type, status, dog_name, breed, size, primary_color,
        last_seen_municipality, last_seen_at, created_at, resolved_at,
        case_images (public_url, is_primary)
      `, { count: 'exact' })
      .eq('status', 'ativo')
      .eq('sensitivity', 'publico')
      .order('created_at', { ascending: false })
      .limit(24),
      
    supabase
      .from('classified_listings')
      .select(`
        id, title, price, location_raw, municipality, listing_url,
        breed_hint, size_hint, color_hint, scraped_at, is_active,
        classified_sources (name, display_name),
        classified_images (image_url)
      `, { count: 'exact' })
      .eq('is_dog', true)
      .eq('is_active', true)
      .order('scraped_at', { ascending: false })
      .limit(24)
  ])

  const unified: UnifiedCatalogueItem[] = []

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

  if (classifiedsRes.data) {
    for (const c of classifiedsRes.data as any[]) {
      unified.push({
        id: c.id,
        source: 'classified',
        source_name: c.classified_sources?.display_name || 'Online',
        type: 'venda',
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

  unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  const finalData = unified.slice(0, 24)
  const totalCount = (casesRes.count || 0) + (classifiedsRes.count || 0)

  return (
    <CasosCatalogueClient 
      locale={locale} 
      initialCases={finalData}
      initialTotal={totalCount}
    />
  )
}
