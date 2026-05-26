import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; municipality?: string }>
}

export default async function CasosPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'case' })

  const supabase = createServiceClient()
  let query = supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, size, primary_color,
      last_seen_municipality, last_seen_at, created_at,
      case_images (id, public_url, is_primary)
    `)
    .eq('status', 'ativo')
    .eq('sensitivity', 'publico')
    .order('created_at', { ascending: false })
    .limit(50)

  if (sp.type) query = query.eq('type', sp.type)
  if (sp.municipality) query = query.eq('last_seen_municipality', sp.municipality)

  const { data: cases } = await query

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Casos ativos</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases?.map((c) => {
          const primaryImg = (c.case_images as Array<{ public_url: string | null; is_primary: boolean }>)?.find((i) => i.is_primary)
          return (
            <Link
              key={c.id}
              href={`/${locale}/caso/${c.slug}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {primaryImg?.public_url ? (
                <img
                  src={primaryImg.public_url}
                  alt={c.dog_name ?? c.breed}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  Sem foto
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {t(`type.${c.type}` as 'type.perdido')}
                  </span>
                </div>
                <p className="font-semibold">{c.dog_name ?? c.breed}</p>
                <p className="text-sm text-muted-foreground">{c.last_seen_municipality}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.last_seen_at as string).toLocaleDateString(locale === 'pt' ? 'pt-PT' : locale)}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {(!cases || cases.length === 0) && (
        <p className="text-muted-foreground text-center py-12">Sem casos ativos.</p>
      )}
    </div>
  )
}
