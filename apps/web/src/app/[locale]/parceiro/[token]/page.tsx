import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ParceiroClient } from './ParceiroClient'

interface PageProps { params: Promise<{ locale: string; token: string }> }

export const metadata = { title: 'Painel de parceiro — Nona' }

export default async function ParceiroPage({ params }: PageProps) {
  const { locale, token } = await params
  const supabase = createServiceClient()
  const { data: partner } = await supabase
    .from('community_partners')
    .select('id, name, municipality, intake_slug')
    .eq('panel_token', token)
    .single()
  if (!partner) notFound()

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''
  return (
    <ParceiroClient
      locale={locale}
      token={token}
      partner={partner as { name: string; municipality: string | null; intake_slug: string }}
      pinnedUrl={`${appUrl}/${locale}/vi-um-cao?p=${partner.intake_slug}`}
    />
  )
}
