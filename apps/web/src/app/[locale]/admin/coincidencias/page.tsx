import { createServiceClient } from '@/lib/supabase/service'
import { getTranslations } from 'next-intl/server'
import { MatchReviewButtons } from './MatchReviewButtons'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: 'pending' | 'all' }>
}

export default async function AdminCoincidenciasPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'admin' })
  const supabase = createServiceClient()

  const filter = sp.filter ?? 'pending'

  let query = supabase
    .from('visual_matches')
    .select(`
      id, score, status, created_at,
      source_case:source_case_id (id, slug, dog_name, breed, last_seen_municipality, last_seen_at,
        case_images (public_url, is_primary)),
      matched_case:matched_case_id (id, slug, dog_name, breed, last_seen_municipality, last_seen_at,
        case_images (public_url, is_primary))
    `)
    .order('score', { ascending: false })
    .limit(50)

  if (filter === 'pending') query = query.eq('status', 'pendente')

  const { data: matches } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('visualMatches')}</h1>
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

      <div className="space-y-4">
        {matches?.map((m) => {
          const src = m.source_case as unknown as MatchCase | null
          const dst = m.matched_case as unknown as MatchCase | null
          const srcImg = getPrimaryImage(src?.case_images)
          const dstImg = getPrimaryImage(dst?.case_images)

          return (
            <div key={m.id} className={`border rounded-xl p-4 ${
              m.status === 'confirmado' ? 'border-green-300 bg-green-50' :
              m.status === 'descartado' ? 'border-muted bg-muted/20 opacity-60' :
              'border-border'
            }`}>
              <div className="flex items-center gap-6">
                {/* Source case */}
                <CaseCard c={src} img={srcImg} locale={locale} />

                {/* Score + status */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{(m.score * 100).toFixed(0)}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">similaridade</span>
                  {m.status !== 'pendente' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {m.status}
                    </span>
                  )}
                </div>

                {/* Matched case */}
                <CaseCard c={dst} img={dstImg} locale={locale} />

                {/* Actions */}
                {m.status === 'pendente' && src && (
                  <MatchReviewButtons matchId={m.id} sourceCaseId={src.id} />
                )}
              </div>
            </div>
          )
        })}
        {(!matches || matches.length === 0) && (
          <p className="text-muted-foreground text-center py-12">
            {filter === 'pending' ? 'Sem coincidências pendentes.' : 'Sem coincidências.'}
          </p>
        )}
      </div>
    </div>
  )
}

type MatchCase = {
  id: string
  slug: string
  dog_name: string | null
  breed: string
  last_seen_municipality: string
  last_seen_at: string
  case_images: Array<{ public_url: string | null; is_primary: boolean }>
}

function getPrimaryImage(images: Array<{ public_url: string | null; is_primary: boolean }> | undefined) {
  if (!images?.length) return null
  return images.find((i) => i.is_primary)?.public_url ?? images[0]?.public_url ?? null
}

function CaseCard({ c, img, locale }: { c: MatchCase | null; img: string | null; locale: string }) {
  if (!c) return <div className="flex-1 text-muted-foreground text-sm">Caso não encontrado</div>
  return (
    <a href={`/${locale}/admin/casos/${c.id}`} className="flex-1 group">
      {img ? (
        <img src={img} alt="" className="w-full h-32 object-cover rounded-lg mb-2 group-hover:opacity-90" />
      ) : (
        <div className="w-full h-32 bg-muted rounded-lg mb-2 flex items-center justify-center text-muted-foreground text-sm">
          Sem foto
        </div>
      )}
      <p className="font-semibold group-hover:underline">{c.dog_name ?? c.breed}</p>
      <p className="text-xs text-muted-foreground">{c.last_seen_municipality}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(c.last_seen_at).toLocaleDateString('pt-PT')}
      </p>
    </a>
  )
}
