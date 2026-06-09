import { createServiceClient } from '@/lib/supabase/service'
import { CasosCatalogueClient, type CaseRecord } from './CasosCatalogueClient'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function CasosPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = createServiceClient()
  
  // Initial SSR fetch for fast first paint and SEO
  const { data: cases, count } = await supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, size, primary_color,
      last_seen_municipality, last_seen_at, created_at, resolved_at,
      case_images (public_url, is_primary)
    `, { count: 'exact' })
    .eq('status', 'ativo')
    .eq('sensitivity', 'publico')
    .order('created_at', { ascending: false })
    .limit(24)

  return (
    <CasosCatalogueClient 
      locale={locale} 
      initialCases={(cases as CaseRecord[]) || []}
      initialTotal={count || 0}
    />
  )
}
