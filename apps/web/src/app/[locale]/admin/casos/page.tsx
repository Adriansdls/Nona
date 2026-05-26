import { createServiceClient } from '@/lib/supabase/service'
import { ALGARVE_MUNICIPALITIES } from '@salvacao/types'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; type?: string; municipality?: string; q?: string }>
}

export default async function AdminCasosPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'admin' })
  const tCase = await getTranslations({ locale, namespace: 'case' })
  const supabase = createServiceClient()

  let query = supabase
    .from('cases')
    .select(`
      id, slug, type, status, dog_name, breed, sex, size,
      last_seen_municipality, last_seen_at, created_at,
      reporter_name, reporter_email, sensitivity
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (sp.status) query = query.eq('status', sp.status)
  if (sp.type) query = query.eq('type', sp.type)
  if (sp.municipality) query = query.eq('last_seen_municipality', sp.municipality)
  if (sp.q) query = query.or(`dog_name.ilike.%${sp.q}%,breed.ilike.%${sp.q}%,reporter_name.ilike.%${sp.q}%`)

  const { data: cases } = await query

  const statusColors: Record<string, string> = {
    ativo: 'bg-primary/10 text-primary',
    resolvido: 'bg-green-100 text-green-700',
    arquivado: 'bg-muted text-muted-foreground',
    duplicado: 'bg-orange-100 text-orange-700',
    descartado: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('cases')}</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-6" method="GET">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Pesquisar..."
          className="border rounded-md px-3 py-1.5 text-sm w-48"
        />
        <select name="status" defaultValue={sp.status} className="border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="">Todos os estados</option>
          {['ativo', 'resolvido', 'arquivado', 'duplicado', 'descartado'].map((s) => (
            <option key={s} value={s}>{tCase(`status.${s}` as 'status.ativo')}</option>
          ))}
        </select>
        <select name="type" defaultValue={sp.type} className="border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="">Todos os tipos</option>
          {['perdido', 'encontrado', 'avistado', 'bienestar'].map((t) => (
            <option key={t} value={t}>{tCase(`type.${t}` as 'type.perdido')}</option>
          ))}
        </select>
        <select name="municipality" defaultValue={sp.municipality} className="border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="">Todos os municípios</option>
          {ALGARVE_MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button type="submit" className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-md">
          Filtrar
        </button>
        <a href="?" className="px-4 py-1.5 border rounded-md text-sm hover:bg-accent">
          Limpar
        </a>
      </form>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Cão</th>
              <th className="px-4 py-2 text-left font-medium">Tipo</th>
              <th className="px-4 py-2 text-left font-medium">Município</th>
              <th className="px-4 py-2 text-left font-medium">Reporter</th>
              <th className="px-4 py-2 text-left font-medium">Estado</th>
              <th className="px-4 py-2 text-left font-medium">Data</th>
              <th className="px-4 py-2 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cases?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2">
                  <Link href={`/${locale}/admin/casos/${c.id}`} className="hover:underline font-medium">
                    {c.dog_name ?? c.breed}
                  </Link>
                  <p className="text-xs text-muted-foreground">{c.breed} · {tCase(`sex.${c.sex}` as 'sex.macho')} · {tCase(`size.${c.size}` as 'size.medio')}</p>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{tCase(`type.${c.type}` as 'type.perdido')}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.last_seen_municipality}</td>
                <td className="px-4 py-2">
                  <p className="font-medium">{c.reporter_name}</p>
                  <p className="text-xs text-muted-foreground">{c.reporter_email}</p>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] ?? 'bg-muted'}`}>
                    {tCase(`status.${c.status}` as 'status.ativo')}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(c.created_at as string).toLocaleDateString('pt-PT')}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/${locale}/caso/${c.slug}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline mr-2"
                  >
                    Ver
                  </Link>
                  <Link href={`/${locale}/admin/casos/${c.id}`} className="text-xs text-primary hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!cases || cases.length === 0) && (
          <p className="text-muted-foreground text-center py-12">Sem casos.</p>
        )}
      </div>
      {cases && <p className="text-xs text-muted-foreground mt-2">{cases.length} caso(s)</p>}
    </div>
  )
}
