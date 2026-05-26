import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })
  return {
    title: t('heroTitle'),
    description: t('heroSubtitle'),
  }
}

async function getStats() {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.rpc('get_public_stats')
    return data as { active_cases: number; resolved_cases: number; total_sightings: number } | null
  } catch {
    return null
  }
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const stats = await getStats()

  return (
    <LandingContent locale={locale} stats={stats} />
  )
}

function LandingContent({
  locale,
  stats,
}: {
  locale: string
  stats: { active_cases: number; resolved_cases: number; total_sightings: number } | null
}) {
  const t = useTranslations('landing')
  const tStats = useTranslations('stats')

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">{t('heroSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${locale}/reportar`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-lg"
            >
              {t('reportCta')}
            </Link>
            <Link
              href={`/${locale}/casos`}
              className="inline-flex items-center justify-center px-6 py-3 border border-input bg-background font-semibold rounded-lg hover:bg-accent transition-colors text-lg"
            >
              {t('viewCases')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-10 bg-white border-y">
          <div className="container mx-auto max-w-3xl">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{stats.active_cases}</p>
                <p className="text-sm text-muted-foreground">{tStats('activeCases')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.resolved_cases}</p>
                <p className="text-sm text-muted-foreground">{tStats('resolvedCases')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.total_sightings}</p>
                <p className="text-sm text-muted-foreground">{tStats('sightings')}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">{t('howItWorks')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {(['1', '2', '3'] as const).map((n) => (
              <div key={n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {n}
                </div>
                <h3 className="font-semibold mb-2">{t(`step${n}` as 'step1')}</h3>
                <p className="text-muted-foreground text-sm">{t(`step${n}Detail` as 'step1Detail')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
