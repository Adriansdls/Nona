import { notFound } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

interface PageProps {
  params: Promise<{ locale: string; token: string }>
}

export const dynamic = 'force-dynamic'

export default async function OwnerDashboard({ params }: PageProps) {
  const { locale, token } = await params

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${appUrl}/api/owner/${token}`, {
    cache: 'no-store',
  })

  if (!res.ok) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any

  return <DashboardClient data={data} locale={locale} token={token} />
}
