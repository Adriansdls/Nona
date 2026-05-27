import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single()

  if (!profile?.verified || !['admin', 'asociacion', 'clinica', 'voluntario'].includes(profile.role)) {
    redirect('/login')
  }

  const t = await getTranslations({ locale, namespace: 'admin' })
  const isAdmin = profile.role === 'admin'

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-muted/20 p-4 flex flex-col gap-1 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Admin
        </p>
        <NavLink href={`/${locale}/admin`} label={t('dashboard')} />
        <NavLink href={`/${locale}/admin/casos`} label={t('cases')} />
        <NavLink href={`/${locale}/admin/avistamentos`} label={t('sightings')} />
        <NavLink href={`/${locale}/admin/coincidencias`} label={t('visualMatches')} />
        {isAdmin && <NavLink href={`/${locale}/admin/usuarios`} label={t('users')} />}
        <div className="flex-1" />
        <p className="text-xs text-muted-foreground px-2">{user.email}</p>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
    >
      {label}
    </Link>
  )
}
