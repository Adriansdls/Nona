import { createServiceClient } from '@/lib/supabase/service'
import { stripPrivateFields } from '@/lib/privacy'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('cases')
    .select('dog_name, breed, last_seen_municipality, type')
    .eq('slug', slug)
    .single()

  if (!data) return {}
  const name = data.dog_name ?? data.breed
  return {
    title: `${name} — ${data.last_seen_municipality}`,
    description: `${data.type === 'perdido' ? 'Cão perdido' : 'Cão encontrado'}: ${name} em ${data.last_seen_municipality}`,
  }
}

export default async function CasoPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('cases')
    .select(`
      id, slug, type, status, sensitivity,
      dog_name, breed, sex, neutered, size,
      primary_color, secondary_color, distinctive_marks, age_estimate,
      has_chip, chip_last_3, last_seen_at, last_seen_municipality,
      last_seen_zone_approx, description, reporter_contact_public,
      created_at, resolved_at,
      case_images (id, public_url, is_primary, image_type)
    `)
    .eq('slug', slug)
    .eq('status', 'ativo')
    .eq('sensitivity', 'publico')
    .single()

  if (error || !data) notFound()

  const safe = stripPrivateFields(data as Record<string, unknown>)
  const t = await getTranslations({ locale, namespace: 'case' })
  const tSighting = await getTranslations({ locale, namespace: 'sighting' })
  const tPoster = await getTranslations({ locale, namespace: 'poster' })

  const images = (safe.caseImages ?? []) as Array<{ id: string; publicUrl: string | null; isPrimary: boolean }>

  // Fetch public sightings
  const { data: sightings } = await supabase
    .from('sightings')
    .select('id, seen_at, municipality, zone_approx, description')
    .eq('case_id', safe.id)
    .eq('is_public', true)
    .order('seen_at', { ascending: false })

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Image gallery */}
      {images.length > 0 && (
        <div className="mb-6">
          <img
            src={images.find((i) => i.isPrimary)?.publicUrl ?? images[0]?.publicUrl ?? ''}
            alt={safe.dogName ?? safe.breed}
            className="w-full h-72 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Title + badges */}
      <div className="flex items-start gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {safe.dogName ?? safe.breed}
            {safe.dogName && <span className="text-muted-foreground font-normal text-lg"> — {safe.breed}</span>}
          </h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {t(`type.${safe.type}` as 'type.perdido')}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {t(`status.${safe.status}` as 'status.ativo')}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6">
        <div><span className="text-muted-foreground">Raça: </span>{safe.breed}</div>
        <div><span className="text-muted-foreground">Tamanho: </span>{t(`size.${safe.size}` as 'size.medio')}</div>
        <div><span className="text-muted-foreground">Cor: </span>{safe.primaryColor}{safe.secondaryColor ? ` / ${safe.secondaryColor}` : ''}</div>
        <div><span className="text-muted-foreground">Sexo: </span>{t(`sex.${safe.sex}` as 'sex.macho')}</div>
        {safe.hasChip && safe.chipLast3 && (
          <div><span className="text-muted-foreground">Chip: </span>···{safe.chipLast3}</div>
        )}
        {safe.ageEstimate && (
          <div><span className="text-muted-foreground">Idade: </span>{safe.ageEstimate}</div>
        )}
      </div>

      {safe.distinctiveMarks && safe.distinctiveMarks.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Marcas distintivas:</p>
          <div className="flex flex-wrap gap-1">
            {(safe.distinctiveMarks as string[]).map((m, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{m}</span>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm">
        <p className="font-medium mb-1">Última vez visto</p>
        <p>{safe.lastSeenMunicipality} — {safe.lastSeenZoneApprox}</p>
        <p className="text-muted-foreground mt-1">
          {new Date(safe.lastSeenAt).toLocaleDateString(locale === 'pt' ? 'pt-PT' : locale, { dateStyle: 'long' })}
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Descrição</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{safe.description}</p>
      </div>

      {/* Contact */}
      {safe.reporterContactPublic && (
        <div className="mb-6 p-4 border rounded-lg">
          <p className="text-sm font-medium mb-1">Contacto público</p>
          <p className="text-sm">{safe.reporterContactPublic}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Link
          href={`/${locale}/caso/${slug}/avistamento`}
          className="flex-1 text-center px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          {tSighting('submitCta')}
        </Link>
        <a
          href={`/api/cases/${slug}/poster?locale=${locale}`}
          className="flex-1 text-center px-4 py-3 border border-input bg-background font-medium rounded-lg hover:bg-accent transition-colors"
        >
          {tPoster('download')}
        </a>
      </div>

      {/* Sightings */}
      {sightings && sightings.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Avistamentos ({sightings.length})</h2>
          <div className="space-y-3">
            {sightings.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>{s.municipality} — {s.zone_approx}</span>
                  <span>{new Date(s.seen_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : locale)}</span>
                </div>
                {s.description && <p className="text-foreground">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
