import { createTransport } from 'nodemailer'
import { Resend } from 'resend'

import { APP_DOMAIN } from '@server/constants'

type SendEmailOptions = {
  to: string
  subject: string
  html: string
  text?: string
}

const RESEND_REQUIRED_ENVS = ['RESEND_API_KEY', 'SMTP_FROM'] as const
const SMTP_REQUIRED_ENVS = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
] as const

const hasRequiredEnvs = (envNames: readonly string[]) => {
  return envNames.every((envName) => Boolean(process.env[envName]))
}

const getMissingEnvs = (envNames: readonly string[]) => {
  return envNames.filter((envName) => !process.env[envName])
}

const sendByResend = async ({ to, subject, html }: SendEmailOptions) => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: `AIProxy Shop <${process.env.SMTP_FROM!}>`,
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`)
  }
}

const sendBySmtp = async (opts: SendEmailOptions) => {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: {
      name: 'AI Proxy Shop',
      address: process.env.SMTP_FROM!,
    },
    ...opts,
  })
}

export const sendEmail = async (opts: SendEmailOptions) => {
  if (opts.to.endsWith(`@${APP_DOMAIN}`)) {
    console.log(`@${APP_DOMAIN}`)
    return
  }

  if (hasRequiredEnvs(RESEND_REQUIRED_ENVS)) {
    await sendByResend(opts)
    return
  }

  if (hasRequiredEnvs(SMTP_REQUIRED_ENVS)) {
    await sendBySmtp(opts)
    return
  }

  const missingResendEnvs = getMissingEnvs(RESEND_REQUIRED_ENVS)
  const missingSmtpEnvs = getMissingEnvs(SMTP_REQUIRED_ENVS)

  throw new Error(
    `Email transport is not configured. Missing Resend envs: ${missingResendEnvs.join(', ') || 'none'}. Missing SMTP envs: ${missingSmtpEnvs.join(', ') || 'none'}.`
  )
}
