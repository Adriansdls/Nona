import { notFound } from 'next/navigation'
import { ClinicaPainelClient } from './ClinicaPainelClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps { params: Promise<{ locale: string; token: string }> }

export const metadata = { title: 'Painel da clínica — Nona' }

export default async function ClinicaPainelPage({ params }: PageProps) {
  const { locale, token } = await params

  const res = await fetch(
    `${process.env['NEXT_PUBLIC_APP_URL'] ?? ''}/api/clinic/panel/${token}`,
    { cache: 'no-store' }
  )
  if (!res.ok) notFound()

  const data = (await res.json()) as {
    clinic: {
      id: string
      name: string
      municipality: string | null
      contactEmail: string | null
      contactPhone: string | null
      vetLicense: string | null
      intakeSlug: string
    }
    scans: Array<{
      scanId: string
      chipNumber: string
      chipLast3: string
      siacStatus: string
      ownerName: string | null
      ownerContact: string | null
      notes: string | null
      createdAt: string
      case: {
        slug: string
        dogName: string | null
        breed: string | null
        status: string
        municipality: string | null
        zone: string | null
        lastSeenAt: string | null
        reporterName: string | null
        reporterEmail: string | null
        reporterPhone: string | null
        ownerToken: string | null
        img: string | null
        adRecommendation: {
          eligible: boolean
          radiusKm: number
          dailyBudgetEur: number
          rationale: string
        } | null
      } | null
    }>
    intakeUrl: string
  }

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? ''

  return (
    <ClinicaPainelClient
      locale={locale}
      token={token}
      clinic={data.clinic}
      scans={data.scans}
      pinnedUrl={`${appUrl}${data.intakeUrl}`}
    />
  )
}
