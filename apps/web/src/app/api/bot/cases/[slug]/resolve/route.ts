import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendCaseResolved, sendResolutionCelebration } from '@/lib/email/send'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

function checkInternalToken(req: NextRequest): boolean {
  const token = req.headers.get('x-internal-token')
  return !!token && token === process.env['INTERNAL_API_TOKEN']
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!checkInternalToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const body = (await req.json()) as { telegram_id: string }

  if (!body.telegram_id) {
    return NextResponse.json({ error: 'telegram_id required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, slug, status, dog_name, reporter_email, reporter_name, reporter_telegram_id')
    .eq('slug', slug)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  // Ownership check — telegram_id must match
  if ((caseRow.reporter_telegram_id as string | null) !== body.telegram_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (caseRow.status === 'resolvido') {
    return NextResponse.json({ data: { slug: caseRow.slug, dog_name: caseRow.dog_name, already: true } })
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: 'resolvido', resolved_at: new Date().toISOString() })
    .eq('id', caseRow.id as string)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const dogName = (caseRow.dog_name as string | null) ?? 'O cão'
  const caseUrl = `${APP_URL}/pt/caso/${slug}`

  // Email the reporter
  void sendCaseResolved({
    to: caseRow.reporter_email as string,
    reporterName: caseRow.reporter_name as string,
    caseSlug: slug,
    dogName: caseRow.dog_name as string | null,
  }).catch((e) => console.warn('Resolved email failed:', e))

  // Resolution celebration (warmer email)
  void sendResolutionCelebration({
    to: caseRow.reporter_email as string,
    reporterName: caseRow.reporter_name as string,
    caseSlug: slug,
    dogName: caseRow.dog_name as string | null,
  }).catch((e) => console.warn('Celebration email failed:', e))

  // Telegram confirmation
  void sendTelegramMessage(
    body.telegram_id,
    `🎉 *${dogName} foi encontrado!*\n\nO caso foi marcado como resolvido. Obrigado por usar o SalvaCão — que alegria para toda a comunidade! 💙\n\n[Ver caso](${caseUrl})`,
  ).catch(() => {})

  return NextResponse.json({ data: { slug: caseRow.slug, dog_name: caseRow.dog_name } })
}
