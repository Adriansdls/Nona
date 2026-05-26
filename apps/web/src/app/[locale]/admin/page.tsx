import { createServiceClient } from '@/lib/supabase/service'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const supabase = createServiceClient()

  const [
    { count: activeCases },
    { count: pendingSightings },
    { count: pendingMatches },
  ] = await Promise.all([
    supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('sightings').select('*', { count: 'exact', head: true }).eq('is_public', false).is('reviewed_by', null),
    supabase.from('visual_matches').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])

  const stats = [
    { label: 'Casos ativos', value: activeCases ?? 0, href: 'casos', color: 'text-primary' },
    { label: t('pendingReview') + ' (avistamentos)', value: pendingSightings ?? 0, href: 'avistamentos', color: 'text-amber-600' },
    { label: t('pendingReview') + ' (coincidências)', value: pendingMatches ?? 0, href: 'coincidencias', color: 'text-blue-600' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard')}</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <a
            key={s.href}
            href={`/${locale}/admin/${s.href}`}
            className="border rounded-xl p-5 hover:shadow-sm transition-shadow bg-white"
          >
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </a>
        ))}
      </div>

      {/* Recent cases */}
      <RecentCases locale={locale} />
    </div>
  )
}

async function RecentCases({ locale }: { locale: string }) {
  const supabase = createServiceClient()
  const { data: cases } = await supabase
    .from('cases')
    .select('id, slug, dog_name, breed, last_seen_municipality, status, created_at, reporter_name')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h2 className="font-semibold mb-3">Casos recentes</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Cão</th>
              <th className="px-4 py-2 text-left font-medium">Município</th>
              <th className="px-4 py-2 text-left font-medium">Reportado por</th>
              <th className="px-4 py-2 text-left font-medium">Estado</th>
              <th className="px-4 py-2 text-left font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {cases?.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2">
                  <a
                    href={`/${locale}/admin/casos/${c.id}`}
                    className="hover:underline font-medium"
                  >
                    {c.dog_name ?? c.breed}
                  </a>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{c.last_seen_municipality}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.reporter_name}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.status === 'ativo' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground text-xs">
                  {new Date(c.created_at as string).toLocaleDateString('pt-PT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!cases || cases.length === 0) && (
          <p className="text-muted-foreground text-center py-8">Sem casos.</p>
        )}
      </div>
    </div>
  )
}
