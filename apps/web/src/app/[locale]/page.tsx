import { createServiceClient } from '@/lib/supabase/service'
import type { Metadata } from 'next'
import { HomePageClient } from './HomePageClient'

export const metadata: Metadata = {
  title: 'Nona — Cada cão merece voltar a casa',
  description: 'Agente de IA para cães perdidos no Algarve. Cartaz, redes sociais, voluntários — em segundos.',
}

async function getReunidosCount(): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { count } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reunido')
    return count ?? 0
  } catch {
    return 0
  }
}

async function getRecentReunidos() {
  try {
    const supabase = createServiceClient()
    // Prefer reunited cases (success stories). Fall back to recent active cases.
    const { data: reunidos } = await supabase
      .from('cases')
      .select('id, slug, type, status, dog_name, breed, last_seen_municipality, resolved_at, case_images(public_url, is_primary)')
      .eq('status', 'reunido')
      .eq('sensitivity', 'publico')
      .order('resolved_at', { ascending: false })
      .limit(7)
    if (reunidos && reunidos.length >= 4) return reunidos

    // Not enough reunidos — fill with recent active cases
    const { data: active } = await supabase
      .from('cases')
      .select('id, slug, type, status, dog_name, breed, last_seen_municipality, resolved_at, case_images(public_url, is_primary)')
      .eq('status', 'ativo')
      .eq('sensitivity', 'publico')
      .order('created_at', { ascending: false })
      .limit(7)
    return active ?? []
  } catch {
    return []
  }
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [reunidosCount, recentReunidos] = await Promise.all([getReunidosCount(), getRecentReunidos()])

  return (
    <HomePageClient
      locale={locale}
      reunidosCount={reunidosCount}
      recentReunidos={recentReunidos}
    />
  )
}
