import { createServiceClient } from '@/lib/supabase/service'
import { getTranslations } from 'next-intl/server'
import { SightingReviewButtons } from './SightingReviewButtons'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ case?: string; filter?: 'pending' | 'all' }>
}

export default async function AdminAvistamentosPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'admin' })
  const supabase = createServiceClient()

  const filter = sp.filter ?? 'pending'

  let query = supabase
    .from('sightings')
    .select(`
      id, seen_at, municipality, zone_approx, description,
      is_public, reporter_contact, credibility, reviewed_by, reviewed_at,
      case:case_id (id, slug, dog_name, breed, last_seen_municipality)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'pending') query = query.eq('is_public', false).is('reviewed_by', null)
  if (sp.case) query = query.eq('case_id', sp.case)

  const { data: sightings } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('sightings')}</h1>
        <div className="flex gap-2 text-sm">
          <a
            href="?filter=pending"
            className={`px-3 py-1.5 rounded-md border ${filter === 'pending' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
          >
            Pendentes
          </a>
          <a
            href="?filter=all"
            className={`px-3 py-1.5 rounded-md border ${filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
          >
            Todos
          </a>
        </div>
      </div>

      <div className="space-y-3">
        {sightings?.map((s) => {
          const c = s.case as unknown as {id: string; slug: string; dog_name: string | null; breed: string; last_seen_municipality: string} | null
          return (
            <div key={s.id} className={`border rounded-lg p-4 ${s.is_public ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {c && (
                      <a
                        href={`/${locale}/admin/casos/${c.id}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {c.dog_name ?? c.breed} ({c.last_seen_municipality})
                      </a>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_public ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {s.is_public ? 'Público' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{s.municipality} — {s.zone_approx}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(s.seen_at).toLocaleString('pt-PT')}
                  </p>
                  {s.description && (
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  )}
                  {s.reporter_contact && (
                    <p className="text-xs mt-2 text-amber-700">
                      Contacto privado: {s.reporter_contact}
                    </p>
                  )}
                </div>

                {!s.is_public && (
                  <SightingReviewButtons sightingId={s.id} />
                )}
              </div>
            </div>
          )
        })}
        {(!sightings || sightings.length === 0) && (
          <p className="text-muted-foreground text-center py-12">
            {filter === 'pending' ? 'Sem avistamentos pendentes.' : 'Sem avistamentos.'}
          </p>
        )}
      </div>
    </div>
  )
}
