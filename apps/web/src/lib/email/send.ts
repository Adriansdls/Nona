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
  locale = 'pt',
}: {
  to: string
  caseSlug: string
  reporterName: string
  locale?: string
}) {
  const caseUrl = `${APP_URL}/${locale}/caso/${caseSlug}`
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
