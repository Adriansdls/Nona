import { sendAdminVisualMatch, sendReporterVisualMatch } from '@/lib/email/send'

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
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

export interface VisualMatchNotifyParams {
  caseASlug: string
  caseAReporterName: string
  caseAReporterEmail: string
  caseAReporterTelegramId: string | null
  caseBSlug: string
  caseBReporterName: string
  caseBReporterEmail: string
  caseBReporterTelegramId: string | null
  score: number
}

export async function notifyVisualMatch(params: VisualMatchNotifyParams): Promise<void> {
  const {
    caseASlug, caseAReporterName, caseAReporterEmail, caseAReporterTelegramId,
    caseBSlug, caseBReporterName, caseBReporterEmail, caseBReporterTelegramId,
    score,
  } = params

  const pct = Math.round(score * 100)
  const urlA = `${APP_URL}/pt/caso/${caseASlug}`
  const urlB = `${APP_URL}/pt/caso/${caseBSlug}`
  const adminEmail = process.env['ADMIN_EMAIL']
  const adminTelegramId = process.env['ADMIN_TELEGRAM_ID']

  await Promise.allSettled([
    // Admin email
    adminEmail
      ? sendAdminVisualMatch({ adminEmail, caseASlug, caseBSlug, score })
      : Promise.resolve(),

    // Reporter A (new case) email
    sendReporterVisualMatch({
      to: caseAReporterEmail,
      reporterName: caseAReporterName,
      yourCaseSlug: caseASlug,
      matchedCaseSlug: caseBSlug,
      score,
      isNewCase: true,
    }),

    // Reporter B (existing case) email
    sendReporterVisualMatch({
      to: caseBReporterEmail,
      reporterName: caseBReporterName,
      yourCaseSlug: caseBSlug,
      matchedCaseSlug: caseASlug,
      score,
      isNewCase: false,
    }),

    // Admin Telegram
    adminTelegramId
      ? sendTelegramMessage(
          adminTelegramId,
          `🔍 *Coincidência visual ${pct}%*\n\nCaso novo: [${caseASlug}](${urlA})\nCaso existente: [${caseBSlug}](${urlB})\n\nRever: ${APP_URL}/pt/admin/coincidencias`,
        )
      : Promise.resolve(),

    // Reporter A Telegram
    caseAReporterTelegramId
      ? sendTelegramMessage(
          caseAReporterTelegramId,
          `🐾 *Possível coincidência encontrada!*\n\nEncontrámos um caso com ${pct}% de semelhança visual ao cão que reportou.\n\nVer caso: ${urlB}\n\n_Confirmação visual necessária antes de agir._`,
        )
      : Promise.resolve(),

    // Reporter B Telegram
    caseBReporterTelegramId
      ? sendTelegramMessage(
          caseBReporterTelegramId,
          `🐾 *Boa notícia! Possível avistamento do seu cão!*\n\nAlguém reportou um cão com ${pct}% de semelhança visual ao seu.\n\nVer caso: ${urlA}\n\n_Confirmação visual necessária antes de agir._`,
        )
      : Promise.resolve(),
  ])
}
