import { NextRequest, NextResponse } from 'next/server'

/**
 * WS-G-Vet: internal endpoint for sending Telegram PM alerts to veterinarians.
 * Called by TIER 1 professional alerts and clinic intake notifications.
 *
 * Protected by x-internal-token. Uses the project's Telegram bot token
 * to send direct messages to vets.
 */

const INTERNAL_TOKEN = process.env['INTERNAL_API_TOKEN'] ?? ''
const TG_BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'] ?? ''

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token')
  if (!token || token !== INTERNAL_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    telegramId?: string | number
    message?: string
  } | null

  if (!body?.telegramId || !body?.message) {
    return NextResponse.json({ error: 'telegramId + message required' }, { status: 400 })
  }

  if (!TG_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(body.telegramId),
        text: body.message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    const data = await res.json() as { ok: boolean; description?: string }

    if (!data.ok) {
      console.warn('[notify-clinic] Telegram send failed:', data.description)
      return NextResponse.json(
        { error: 'Telegram send failed', detail: data.description },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[notify-clinic] Exception:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
