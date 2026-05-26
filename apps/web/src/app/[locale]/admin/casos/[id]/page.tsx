import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AdminCaseActions } from './AdminCaseActions'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const { locale, id } = await params
  const supabase = createServiceClient()
  const t = await getTranslations({ locale, namespace: 'admin' })
  const tCase = await getTranslations({ locale, namespace: 'case' })

  const { data: c, error } = await supabase
    .from('cases')
    .select(`
      *,
      case_images (id, public_url, storage_path_original, is_primary, image_type, quality_score, processed_at)
    `)
    .eq('id', id)
    .single()

  if (error || !c) notFound()

  const { data: sightings } = await supabase
    .from('sightings')
    .select('id, seen_at, municipality, zone_approx, description, is_public, reporter_contact, credibility, reviewed_by, reviewed_at')
    .eq('case_id', id)
    .order('seen_at', { ascending: false })

  const { data: matches } = await supabase
    .from('visual_matches')
    .select(`
      id, score, status, reviewed_by, reviewed_at,
      matched_case:matched_case_id (id, slug, dog_name, breed, last_seen_municipality)
    `)
    .eq('source_case_id', id)
    .order('score', { ascending: false })

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/admin/casos`} className="text-muted-foreground hover:text-foreground text-sm">
          ← Casos
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">{c.dog_name ?? c.breed}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          c.status === 'ativo' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          {tCase(`status.${c.status}` as 'status.ativo')}
        </span>
        <Link
          href={`/${locale}/caso/${c.slug}`}
          target="_blank"
          className="ml-auto text-sm text-primary hover:underline"
        >
          Ver página pública ↗
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dog info */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Informação do Cão</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Tipo" value={tCase(`type.${c.type}` as 'type.perdido')} />
            <Row label="Raça" value={c.breed} />
            <Row label="Sexo" value={tCase(`sex.${c.sex}` as 'sex.macho')} />
            <Row label="Tamanho" value={tCase(`size.${c.size}` as 'size.medio')} />
            <Row label="Cor" value={`${c.primary_color}${c.secondary_color ? ` / ${c.secondary_color}` : ''}`} />
            {c.age_estimate && <Row label="Idade" value={c.age_estimate} />}
            {c.has_chip && <Row label="Chip" value={c.chip_last_3 ? `···${c.chip_last_3}` : 'Sim'} />}
            {c.distinctive_marks?.length > 0 && (
              <Row label="Marcas" value={(c.distinctive_marks as string[]).join(', ')} />
            )}
          </dl>
        </div>

        {/* Private reporter info */}
        <div className="border rounded-lg p-4 bg-amber-50">
          <h2 className="font-semibold mb-3">Dados Privados (Reportador)</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Nome" value={c.reporter_name} />
            <Row label="Email" value={c.reporter_email} />
            {c.reporter_phone && <Row label="Telemóvel" value={c.reporter_phone} />}
            {c.reporter_contact_public && (
              <Row label="Contacto público" value={c.reporter_contact_public} />
            )}
            {c.suspected_theft && (
              <Row label="Suspeita de furto" value="Sim" />
            )}
          </dl>
        </div>

        {/* Location */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Localização</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Município" value={c.last_seen_municipality} />
            <Row label="Zona" value={c.last_seen_zone_approx} />
            <Row
              label="Data/hora"
              value={new Date(c.last_seen_at).toLocaleString('pt-PT')}
            />
          </dl>
        </div>

        {/* Admin actions */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Ações</h2>
          <AdminCaseActions caseId={id} currentStatus={c.status} locale={locale} />
          {c.admin_notes && (
            <div className="mt-3 p-3 bg-muted rounded text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">Notas admin:</p>
              <p>{c.admin_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="border rounded-lg p-4 mt-6">
        <h2 className="font-semibold mb-2">Descrição</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.description}</p>
        {c.context && (
          <>
            <h3 className="font-medium mt-3 mb-1 text-sm">Contexto</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.context}</p>
          </>
        )}
      </div>

      {/* Images */}
      {c.case_images?.length > 0 && (
        <div className="border rounded-lg p-4 mt-6">
          <h2 className="font-semibold mb-3">Imagens ({c.case_images.length})</h2>
          <div className="flex flex-wrap gap-3">
            {(c.case_images as Array<{id: string; public_url: string | null; is_primary: boolean; quality_score: number | null; processed_at: string | null}>).map((img) => (
              <div key={img.id} className="relative">
                {img.public_url ? (
                  <img src={img.public_url} alt="" className="w-32 h-32 object-cover rounded" />
                ) : (
                  <div className="w-32 h-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    A processar...
                  </div>
                )}
                {img.is_primary && (
                  <span className="absolute top-1 left-1 text-xs bg-primary text-primary-foreground px-1 rounded">
                    Principal
                  </span>
                )}
                {img.quality_score !== null && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Q: {(img.quality_score * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sightings */}
      <div className="border rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Avistamentos ({sightings?.length ?? 0})</h2>
          <Link href={`/${locale}/admin/avistamentos?case=${id}`} className="text-xs text-primary hover:underline">
            Ver tudo
          </Link>
        </div>
        {sightings && sightings.length > 0 ? (
          <div className="space-y-2">
            {sightings.map((s) => (
              <div key={s.id} className={`p-3 rounded-lg text-sm border ${s.is_public ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{s.municipality} — {s.zone_approx}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(s.seen_at).toLocaleDateString('pt-PT')}
                  </span>
                </div>
                {s.description && <p className="text-muted-foreground">{s.description}</p>}
                <p className="text-xs mt-1">
                  {s.is_public ? '✓ Público' : '⏳ Pendente revisão'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sem avistamentos.</p>
        )}
      </div>

      {/* Visual matches */}
      {matches && matches.length > 0 && (
        <div className="border rounded-lg p-4 mt-6">
          <h2 className="font-semibold mb-3">Possíveis Coincidências ({matches.length})</h2>
          <div className="space-y-2">
            {matches.map((m) => {
              const mc = m.matched_case as unknown as {id: string; slug: string; dog_name: string | null; breed: string; last_seen_municipality: string} | null
              return (
                <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{mc?.dog_name ?? mc?.breed ?? 'Desconhecido'}</span>
                    <span className="text-muted-foreground ml-2">— {mc?.last_seen_municipality}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Score: {(m.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                      m.status === 'descartado' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {m.status}
                    </span>
                    {mc && (
                      <Link href={`/${locale}/admin/casos/${mc.id}`} className="text-xs text-primary hover:underline">
                        Ver caso
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Downloads */}
      <div className="flex gap-3 mt-6">
        <a
          href={`/api/cases/${c.slug}/poster?locale=${locale}`}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
        >
          Descarregar poster
        </a>
        <a
          href={`/api/admin/cases/${id}/dossier`}
          className="px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors"
        >
          Gerar dossier
        </a>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-28 text-muted-foreground shrink-0">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
