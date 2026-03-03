import { createTransport } from 'nodemailer'
import { APP_DOMAIN } from '@server/constants'

interface SendEmailOpts {
  to: string
  subject: string
  text?: string
  html?: string
}

export const sendEmail = async (opts: SendEmailOpts) => {
  if (opts.to.endsWith(`@${APP_DOMAIN}`)) {
    console.log(`@${APP_DOMAIN}`)
    return
  }
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: {
        name: 'AI Proxy Shop',
        address: process.env.SMTP_FROM!,
      },
      ...opts,
    })
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
