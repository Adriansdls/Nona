import { createServiceClient } from '@/lib/supabase/service'
import { ClinicasManager } from './ClinicasManager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps { params: Promise<{ locale: string }> }

export default async function AdminClinicasPage({ params }: PageProps) {
  const { locale } = await params
  const supabase = createServiceClient()
  const { data: clinics } = await supabase
    .from('clinic_partners')
    .select('id, name, municipality, vet_license, contact_email, contact_phone, is_approved, intake_slug, panel_token, created_at')
    .order('created_at', { ascending: false })

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clínicas veterinárias</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clínicas parceiras que registam chips e cruzam com cães perdidos. Cada uma recebe um link público para a receção e um painel privado.
        </p>
      </div>
      <ClinicasManager locale={locale} appUrl={appUrl} initial={clinics ?? []} />
    </div>
  )
}
