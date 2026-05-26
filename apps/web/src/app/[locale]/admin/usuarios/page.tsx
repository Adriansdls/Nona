import { createServiceClient } from '@/lib/supabase/service'
import { getTranslations } from 'next-intl/server'
import { UserRoleForm } from './UserRoleForm'

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function AdminUsuariosPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin' })
  const supabase = createServiceClient()

  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, role, verified, created_at')
    .order('created_at', { ascending: false })

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    asociacion: 'bg-purple-100 text-purple-700',
    clinica: 'bg-blue-100 text-blue-700',
    voluntario: 'bg-green-100 text-green-700',
    publico: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('users')}</h1>
        <InviteForm />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Utilizador</th>
              <th className="px-4 py-2 text-left font-medium">Role</th>
              <th className="px-4 py-2 text-left font-medium">Verificado</th>
              <th className="px-4 py-2 text-left font-medium">Desde</th>
              <th className="px-4 py-2 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] ?? 'bg-muted'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.verified ? (
                    <span className="text-green-600 text-sm">✓</span>
                  ) : (
                    <span className="text-amber-600 text-sm">⏳</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('pt-PT')}
                </td>
                <td className="px-4 py-3">
                  <UserRoleForm userId={u.id} currentRole={u.role} verified={u.verified} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!users || users.length === 0) && (
          <p className="text-muted-foreground text-center py-12">Sem utilizadores.</p>
        )}
      </div>
    </div>
  )
}

function InviteForm() {
  return (
    <form action="/api/admin/invite" method="POST" className="flex gap-2">
      <input
        name="email"
        type="email"
        placeholder="email@exemplo.com"
        required
        className="border rounded-md px-3 py-1.5 text-sm w-56"
      />
      <button
        type="submit"
        className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg"
      >
        Convidar
      </button>
    </form>
  )
}
