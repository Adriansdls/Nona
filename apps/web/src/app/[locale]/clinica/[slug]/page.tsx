import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ClinicaClient } from './ClinicaClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps { params: Promise<{ locale: string; slug: string }> }

export const metadata = { title: 'Registar chip — Nona' }

export default async function ClinicaPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = createServiceClient()

  const { data: clinic } = await supabase
    .from('clinic_partners')
    .select('id, name, municipality, intake_slug, panel_token')
    .eq('intake_slug', slug)
    .eq('is_approved', true)
    .single()

  if (!clinic) notFound()

  return (
    <ClinicaClient
      locale={locale}
      clinic={clinic as { name: string; municipality: string | null; intake_slug: string; panel_token: string }}
    />
  )
}
