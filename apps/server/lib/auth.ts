import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { eq } from 'drizzle-orm'
import { magicLink, phoneNumber } from 'better-auth/plugins'
import { sendEmail } from '@server/lib/emails/send'
import { renderEmail } from '@server/lib/emails/render'
import { createAuthMiddleware, APIError } from 'better-auth/api'
import { IS_DEV, APP_DOMAIN } from '@server/constants'
import { teamPlugin } from '@server/lib/better-auth/team'
import { createPhoneAuthConfig } from '@openproxy/phone-auth/server'
import { createTeam, getTeams } from '@server/services/team'

const trustedOriginsFromEnv = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const defaultTrustedOrigins = [
  `https://${APP_DOMAIN}`,
  `https://${APP_DOMAIN}:*`,
  `http://${APP_DOMAIN}`,
  `http://${APP_DOMAIN}:*`,
  `https://*.${APP_DOMAIN}`,
  `https://*.${APP_DOMAIN}:*`,
  `http://*.${APP_DOMAIN}`,
  `http://*.${APP_DOMAIN}:*`,
  'http://localhost:*',
  'https://localhost:*',
  'http://127.0.0.1:*',
  'https://127.0.0.1:*',
]

const trustedOrigins = Array.from(
  new Set([...defaultTrustedOrigins, ...trustedOriginsFromEnv])
)

const githubProviderEnable = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
)

const googleProviderEnable = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
)

const phoneAuth = createPhoneAuthConfig({
  findUserByPhone: async (phoneNumber) => {
    return db.query.users.findFirst({
      where: eq(dbSchema.users.phoneNumber, phoneNumber),
    })
  },
})

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL!,
  basePath: '/api/auth',
  advanced: {
    database: {
      generateId: false,
    },
    crossSubDomainCookies: {
      enabled: !IS_DEV,
      domain: `.${APP_DOMAIN}`,
    },
    ...(!IS_DEV && {
      defaultCookieAttributes: {
          sameSite: 'lax',
          secure: true,
          domain: `.${APP_DOMAIN}`,
        }
    })
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: dbSchema.users,
      session: dbSchema.sessions,
      account: dbSchema.accounts,
      verification: dbSchema.verifications,
    },
  }),
  session: {
    additionalFields: {
      teamId: {
        type: 'string',
        required: false,
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'tenant',
      },
    },
    changeEmail: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      await sendEmail({
        to: user.email,
        html: await renderEmail('Verify', { url }),
        subject: '邮箱验证',
      })
    },
  },
  plugins: [
    magicLink({
      async sendMagicLink({ email, url }) {
        await sendEmail({
          to: email,
          html: await renderEmail('MagicLink', { url }),
          subject: '邮箱验证',
        })
      },
    }),
    phoneNumber({
      async sendOTP({ phoneNumber, code }) {
        if (IS_DEV) {
          console.log(phoneNumber, code)
          return
        }
        await phoneAuth.smsProvider.sendSMS(phoneNumber, code)
      },
    }),
    phoneAuth.phoneLoginPlugin,
    teamPlugin,
  ],
  trustedOrigins,
  socialProviders: {
    ...(githubProviderEnable && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    }),

    ...(googleProviderEnable && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }),
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path

      if (path === '/phone-number/send-otp' && !IS_DEV) {
        const captchaData = ctx.body?.captchaData
        if (!captchaData) throw new APIError('INTERNAL_SERVER_ERROR')
        try {
          await phoneAuth.captchaProvider.verify(
            captchaData,
            Bun.env.ALI_CAPTCHA_API_KEY!
          )
        } catch {
          throw new APIError('INTERNAL_SERVER_ERROR')
        }
      }
      return
    }),
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const teams = await getTeams(session.userId)
          return {
            data: {
              ...session,
              teamId: teams[0]?.teamId || null,
            },
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          await createTeam(user.id)
        },
      },
    },
  },
})
