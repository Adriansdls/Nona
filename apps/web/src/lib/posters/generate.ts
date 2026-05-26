// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToBuffer } = require('@react-pdf/renderer') as { renderToBuffer: (element: unknown) => Promise<Buffer> }
import QRCode from 'qrcode'
import { createElement } from 'react'
import { PosterA4 } from './PosterA4'
import { DossierPDF } from './DossierPDF'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

interface CaseData {
  slug: string
  type: string
  dog_name: string | null
  breed: string
  sex: string
  size: string
  primary_color: string
  secondary_color: string | null
  distinctive_marks: string[]
  age_estimate: string | null
  has_chip: boolean | null
  chip_last_3: string | null
  last_seen_at: string
  last_seen_municipality: string
  last_seen_zone_approx: string
  description: string
  reporter_contact_public: string | null
  reporter_name?: string
  reporter_email?: string
  reporter_phone?: string | null
  case_images?: Array<{ public_url: string | null; is_primary: boolean }>
  sightings?: Array<{
    municipality: string
    zone_approx: string
    seen_at: string
    description: string | null
    is_public: boolean
  }>
}

export async function generatePosterA4(
  caseData: CaseData,
  locale: 'pt' | 'en' | 'es' = 'pt',
): Promise<Buffer> {
  const caseUrl = `${APP_URL}/${locale}/caso/${caseData.slug}`
  const qrDataUrl = await QRCode.toDataURL(caseUrl, { width: 300, margin: 2 })

  const primaryImage = caseData.case_images?.find((i) => i.is_primary)
  const photoUrl = primaryImage?.public_url ?? null

  const element = createElement(PosterA4, {
    caseData,
    qrDataUrl,
    photoUrl,
    locale,
  })

  return await renderToBuffer(element)
}

export async function generateDossierPDF(
  caseData: CaseData & { id: string },
  options: { includePrivate: boolean },
): Promise<Buffer> {
  const element = createElement(DossierPDF, {
    caseData,
    includePrivate: options.includePrivate,
  })
  return await renderToBuffer(element)
}
