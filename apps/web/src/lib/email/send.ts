import nodemailer from 'nodemailer'

function getTransport() {
  if (process.env['NODE_ENV'] === 'development' || process.env['SMTP_HOST']) {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'] ?? 'localhost',
      port: parseInt(process.env['SMTP_PORT'] ?? '1025'),
      secure: false,
      auth: undefined,
    })
  }
  // Production: use Resend SMTP relay
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    auth: {
      user: 'resend',
      pass: process.env['RESEND_API_KEY'],
    },
  })
}

const FROM = process.env['EMAIL_FROM'] ?? 'noreply@salvacao.local'
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

export async function sendCaseConfirmation({
  to,
  caseSlug,
  reporterName,
  ownerToken,
  locale = 'pt',
}: {
  to: string
  caseSlug: string
  reporterName: string
  ownerToken?: string | null
  locale?: string
}) {
  const caseUrl = `${APP_URL}/${locale}/caso/${caseSlug}`
  const dashboardUrl = ownerToken ? `${APP_URL}/${locale}/meu-caso/${ownerToken}` : null
  const subject =
    locale === 'en' ? 'Case registered — SalvaCão' : 'Caso registado — SalvaCão'

  await getTransport().sendMail({
    from: FROM,
    to,
    subject,
    html: `
      <p>Olá ${reporterName},</p>
      <p>O seu caso foi registado com sucesso.</p>
      <p><a href="${caseUrl}">Ver caso: ${caseUrl}</a></p>
      ${dashboardUrl ? `
      <p style="margin-top:16px;padding:12px 16px;background:#f4f4f1;border-radius:8px;">
        <strong>O seu painel pessoal (privado):</strong><br/>
        <a href="${dashboardUrl}">${dashboardUrl}</a><br/>
        <small style="color:#666">Aqui pode acompanhar o que o investigador está a fazer, ver avistamentos e marcar o cão como encontrado.</small>
      </p>
      ` : ''}
      <p>Irá receber uma notificação quando alguém reportar um avistamento.</p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão — tecnologia gratuita para salvar cães no Algarve</p>
    `,
  })
}

export async function sendNewSighting({
  to,
  reporterName,
  caseSlug,
  municipality,
  zoneApprox,
  locale = 'pt',
}: {
  to: string
  reporterName: string
  caseSlug: string
  municipality: string
  zoneApprox: string
  locale?: string
}) {
  const caseUrl = `${APP_URL}/${locale}/caso/${caseSlug}`
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: `Novo avistamento — ${caseSlug}`,
    html: `
      <p>Olá ${reporterName},</p>
      <p>Um novo avistamento foi reportado para o seu caso.</p>
      <p><strong>Zona:</strong> ${zoneApprox}, ${municipality}</p>
      <p>O avistamento está a ser revisto pela nossa equipa antes de ser publicado.</p>
      <p><a href="${caseUrl}">Ver caso</a></p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão</p>
    `,
  })
}

export async function sendCaseResolved({
  to,
  reporterName,
  caseSlug,
  dogName,
  locale = 'pt',
}: {
  to: string
  reporterName: string
  caseSlug: string
  dogName: string | null
  locale?: string
}) {
  const caseUrl = `${APP_URL}/${locale}/caso/${caseSlug}`
  const name = dogName ?? 'O cão'
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: `${name} foi encontrado! — SalvaCão`,
    html: `
      <p>Olá ${reporterName},</p>
      <p><strong>${name} foi encontrado!</strong></p>
      <p>Obrigado a toda a comunidade que ajudou.</p>
      <p><a href="${caseUrl}">Ver caso resolvido</a></p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão</p>
    `,
  })
}

export async function sendResolutionCelebration({
  to,
  reporterName,
  caseSlug,
  dogName,
  locale = 'pt',
}: {
  to: string
  reporterName: string
  caseSlug: string
  dogName: string | null
  locale?: string
}) {
  const dogLabel = dogName ?? 'O seu cão'
  const caseUrl = `${APP_URL}/${locale}/caso/${caseSlug}`
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: `🎉 ${dogLabel} foi encontrado! — SalvaCão`,
    html: `
      <p>Olá ${reporterName},</p>
      <p>Que notícia maravilhosa — <strong>${dogLabel} foi encontrado!</strong></p>
      <p>Obrigado por usar o SalvaCão. A vossa história faz parte do que motiva toda a equipa a continuar.</p>
      <p><a href="${caseUrl}">Ver caso resolvido</a></p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão — tecnologia gratuita para salvar cães no Algarve</p>
    `,
  })
}

export async function sendAdminVisualMatch({
  adminEmail,
  caseASlug,
  caseBSlug,
  score,
}: {
  adminEmail: string
  caseASlug: string
  caseBSlug: string
  score: number
}) {
  const urlA = `${APP_URL}/pt/caso/${caseASlug}`
  const urlB = `${APP_URL}/pt/caso/${caseBSlug}`
  const pct = Math.round(score * 100)
  await getTransport().sendMail({
    from: FROM,
    to: adminEmail,
    subject: `[SalvaCão] Coincidência visual ${pct}% — ${caseASlug} ↔ ${caseBSlug}`,
    html: `
      <p>Foi detectada uma coincidência visual de <strong>${pct}%</strong> entre dois casos.</p>
      <p>Caso A (novo): <a href="${urlA}">${caseASlug}</a></p>
      <p>Caso B (existente): <a href="${urlB}">${caseBSlug}</a></p>
      <p><a href="${APP_URL}/pt/admin/coincidencias">Rever no painel de administração</a></p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão</p>
    `,
  })
}

export async function sendReporterVisualMatch({
  to,
  reporterName,
  yourCaseSlug,
  matchedCaseSlug,
  score,
  isNewCase,
  locale = 'pt',
}: {
  to: string
  reporterName: string
  yourCaseSlug: string
  matchedCaseSlug: string
  score: number
  isNewCase: boolean
  locale?: string
}) {
  const matchedUrl = `${APP_URL}/${locale}/caso/${matchedCaseSlug}`
  const pct = Math.round(score * 100)
  const subject = `Possível coincidência encontrada — SalvaCão`
  const body = isNewCase
    ? `Encontrámos um caso já existente que pode corresponder ao cão que reportou (${pct}% de semelhança visual).`
    : `Alguém reportou um cão que pode ser o seu (${pct}% de semelhança visual).`
  await getTransport().sendMail({
    from: FROM,
    to,
    subject,
    html: `
      <p>Olá ${reporterName},</p>
      <p>${body}</p>
      <p><a href="${matchedUrl}">Ver caso correspondente</a></p>
      <p style="font-size:12px;color:#888">Esta é uma correspondência automática — confirme visualmente antes de agir.</p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão</p>
    `,
  })
}

export async function sendAdminInvite({
  to,
  inviterName,
  role,
}: {
  to: string
  inviterName: string
  role: string
}) {
  const loginUrl = `${APP_URL}/login`
  await getTransport().sendMail({
    from: FROM,
    to,
    subject: 'Convite para SalvaCão',
    html: `
      <p>Olá,</p>
      <p>${inviterName} convidou-o para o painel SalvaCão com o papel: <strong>${role}</strong>.</p>
      <p><a href="${loginUrl}">Aceitar convite e entrar</a></p>
      <hr/>
      <p style="font-size:12px;color:#666">SalvaCão</p>
    `,
  })
}
