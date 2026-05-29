import { ViUmCaoClient } from './ViUmCaoClient'

export const metadata = {
  title: 'Vi um cão — Nona',
  description: 'Viste um cão à solta no Algarve? Uma foto e onde — cruzamos com os cães perdidos.',
}

export default async function ViUmCaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ p?: string }>
}) {
  const { locale } = await params
  const { p } = await searchParams // ?p=<partner intake slug> attributes a community submit
  return <ViUmCaoClient locale={locale} {...(p ? { partnerId: p } : {})} />
}
