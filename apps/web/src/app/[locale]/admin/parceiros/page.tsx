import { createServiceClient } from '@/lib/supabase/service'
import { ParceirosManager } from './ParceirosManager'

interface PageProps { params: Promise<{ locale: string }> }

export default async function AdminParceirosPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = createServiceClient()
  const { data: partners } = await supabase
    .from('community_partners')
    .select('id, name, municipality, contact, intake_slug, panel_token, created_at')
    .order('created_at', { ascending: false })

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Parceiros de comunidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Admins de grupos de Facebook / associações. Cada um recebe um link público para fixar no grupo e um painel privado.
        </p>
      </div>
      <ParceirosManager locale={locale} appUrl={appUrl} initial={partners ?? []} />
    </div>
  )
}
