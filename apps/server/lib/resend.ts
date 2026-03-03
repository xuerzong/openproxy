import { Resend } from 'resend'

import { APP_DOMAIN } from '@server/constants'

const createResend = () => {
  return new Resend(process.env.RESEND_API_KEY)
}
interface SendEmailOptions {
  to: string
  html: string
  subject: string
}

export const sendEmail = async ({ to, html, subject }: SendEmailOptions) => {
  if (to.endsWith(`@${APP_DOMAIN}`)) {
    console.log(`@${APP_DOMAIN}`)
    return
  }

  const resend = createResend()

  const { error } = await resend.emails.send({
    from: `AIProxy Shop <${process.env.SMTP_FROM!}>`,
    to,
    subject,
    html,
  })
  if (error) {
    console.log(error)
  }
}
