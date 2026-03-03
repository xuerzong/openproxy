import { Elysia } from 'elysia'
import * as Sentry from '@sentry/bun'

const sentryEnable = Boolean(Bun.env.SENTRY_DSN)

Sentry.init({
  dsn: Bun.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: 'production',
})

export const sentryPlugin = new Elysia()
  .decorate('Sentry', Sentry)
  .onError({ as: 'global' }, async ({ error, request, code }) => {
    if (Bun.env.NODE_ENV === 'production' && sentryEnable) {
      Sentry.captureException(error, {
        tags: {
          errorCode: code,
        },
        extra: {
          url: request.url,
          method: request.method,
        },
      })
    }
  })
