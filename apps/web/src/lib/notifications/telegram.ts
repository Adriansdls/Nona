export async function sendTelegramMessage(
  chatId: string | null | undefined,
  text: string,
): Promise<void> {
  const token = process.env['TELEGRAM_BOT_TOKEN']
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // non-fatal
  }
}
