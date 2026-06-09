import { createServiceClient } from '@/lib/supabase/service'
import { getTranslations } from 'next-intl/server'
import { SuspiciousMatchCard } from './SuspiciousMatchCard'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: 'pending' | 'high' | 'all' }>
}

export default async function AdminAnunciosSuspeitosPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'admin' })
  const supabase = createServiceClient()

  const filter = sp.filter ?? 'pending'

  let query = supabase
    .from('suspicious_matches')
    .select(`
      id, similarity_score, priority, status, created_at, notes,
      classified_listing:classified_listing_id (
        id, title, price, location_raw, municipality, listing_url, description,
        breed_hint, size_hint, color_hint, posted_at, scraped_at,
        classified_images (id, image_url, storage_path),
        classified_sources:name, display_name
      ),
      case:case_id (
        id, slug, dog_name, breed, primary_color, last_seen_municipality, last_seen_at,
        case_images (public_url, is_primary)
      )
    `)
    .order('similarity_score', { ascending: false })
    .limit(50)

  if (filter === 'pending') query = query.eq('status', 'pendente')
  if (filter === 'high') query = query.eq('priority', 'high')

  const { data: matches } = await query

  const pendingCount = await supabase
    .from('suspicious_matches')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Anúncios Suspeitos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Classificados de venda de cães com correspondência visual a casos perdidos.
            {pendingCount.count != null && (
              <span className="ml-2 font-medium text-primary">
                {pendingCount.count} pendente{pendingCount.count !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <a
            href="?filter=pending"
            className={`px-3 py-1.5 rounded-md border ${filter === 'pending' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
          >
            Pendentes
          </a>
          <a
            href="?filter=high"
            className={`px-3 py-1.5 rounded-md border ${filter === 'high' ? 'bg-red-600 text-white border-red-600' : 'hover:bg-accent border'}`}
          >
            Alta prioridade
          </a>
          <a
            href="?filter=all"
            className={`px-3 py-1.5 rounded-md border ${filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
          >
            Todos
          </a>
        </div>
      </div>

      <div className="space-y-4">
        {matches?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum anúncio suspeito encontrado.
          </div>
        )}
        {matches?.map((m) => (
          <SuspiciousMatchCard key={m.id} match={m} locale={locale} />
        ))}
      </div>
    </div>
  )
}