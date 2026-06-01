import { notFound, redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

interface PageProps {
  params: Promise<{ locale: string; token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

// The owner dashboard has been folded onto the unified case page (P6). This
// route now just resolves the owner_token → slug and redirects to the one page,
// preserving emailed/Telegram links. Owner powers render there when ?t=token.
export default async function OwnerDashboardRedirect({ params, searchParams }: PageProps) {
  const { locale, token } = await params
  const sp = await searchParams

  const supabase = createServiceClient()
  const { data: caseRow } = await supabase
    .from('cases')
    .select('slug')
    .eq('owner_token', token)
    .single()

  if (!caseRow?.slug) notFound()

  // Carry through ?connect=1 (magic-link return) so the auto-link useEffect fires.
  const connect = sp['connect'] ? '&connect=1' : ''
  redirect(`/${locale}/caso/${caseRow.slug}?t=${token}${connect}`)
}
