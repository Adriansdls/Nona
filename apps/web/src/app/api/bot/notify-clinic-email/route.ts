import { NextRequest, NextResponse } from 'next/server'
import { sendProfessionalAlert } from '@/lib/email/send'

/**
 * WS-G-Vet: internal endpoint for sending email alerts to clinics.
 * Called by TIER 1 professional alerts and clinic intake notifications.
 */

const INTERNAL_TOKEN = process.env['INTERNAL_API_TOKEN'] ?? ''

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token')
  if (!token || token !== INTERNAL_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    to?: string
    clinicName?: string
    caseSlug?: string
    kind?: 'match' | 'created'
  } | null

  if (!body?.to || !body?.clinicName || !body?.caseSlug) {
    return NextResponse.json({ error: 'to + clinicName + caseSlug required' }, { status: 400 })
  }

  try {
    await sendProfessionalAlert({
      to: body.to,
      orgName: body.clinicName,
      orgKind: 'clinica',
      caseSlug: body.caseSlug,
      dogName: null,
      breed: '',
      primaryColor: '',
      municipality: '',
      zone: null,
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[notify-clinic-email] Failed:', e)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }
}
