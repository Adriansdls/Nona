import { createServiceClient } from '@/lib/supabase/service'
import type { Metadata } from 'next'
import { HomePageClient, type RecentCase } from './HomePageClient'

export const metadata: Metadata = {
  title: 'Nona — Investigador privado para cães perdidos no Algarve',
  description: 'Um investigador IA atribuído ao teu caso. Protocolo científico, contacto a canils e veterinários, monitorização 24/7. Grátis para proprietários de animais no Algarve.',
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

async function getRecentReunidos(): Promise<RecentCase[]> {
  try {
    const supabase = createServiceClient()
    // Prefer reunited cases (success stories). Fall back to recent active cases.
    const { data: reunidos } = await supabase
      .from('cases')
      .select('id, slug, type, status, dog_name, breed, last_seen_municipality, resolved_at, created_at, case_images(public_url, is_primary)')
      .eq('status', 'reunido')
      .eq('sensitivity', 'publico')
      .order('resolved_at', { ascending: false })
      .limit(7)
    if (reunidos && reunidos.length >= 4) return reunidos as unknown as RecentCase[]

    // Not enough reunidos — fill with recent active cases
    const { data: active } = await supabase
      .from('cases')
      .select('id, slug, type, status, dog_name, breed, last_seen_municipality, resolved_at, created_at, case_images(public_url, is_primary)')
      .eq('status', 'ativo')
      .eq('sensitivity', 'publico')
      .order('created_at', { ascending: false })
      .limit(7)
    return (active ?? []) as unknown as RecentCase[]
  } catch {
    return []
  }
}

async function getRecentByType(type: 'perdido' | 'encontrado'): Promise<RecentCase[]> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('cases')
      .select('id, slug, type, status, dog_name, breed, last_seen_municipality, resolved_at, created_at, case_images(public_url, is_primary)')
      .eq('type', type)
      .eq('status', 'ativo')
      .eq('sensitivity', 'publico')
      .order('created_at', { ascending: false })
      .limit(7)
    return (data ?? []) as unknown as RecentCase[]
  } catch {
    return []
  }
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [reunidosCount, recentReunidos, recentMissing, recentFound] = await Promise.all([
    getReunidosCount(),
    getRecentReunidos(),
    getRecentByType('perdido'),
    getRecentByType('encontrado'),
  ])

  return (
    <HomePageClient
      locale={locale}
      reunidosCount={reunidosCount}
      recentReunidos={recentReunidos}
      recentMissing={recentMissing}
      recentFound={recentFound}
    />
  )
}
