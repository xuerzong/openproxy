import { Elysia } from 'elysia'
import { apiRouter } from './api'
import { betterAuthRouter } from './better-auth'
import { emailPreviewerRouter } from './email-previewer'
import { cronRouter } from './cron'
import { payRouter } from './pay'
import { openApiRouter } from './openapi'

export const router = new Elysia({ name: 'api' })
  .use(betterAuthRouter)
  .use(cronRouter)
  .use(apiRouter)
  .use(openApiRouter)
  .use(emailPreviewerRouter)
  .use(payRouter)
  .get('/health-check', () => ({
    msg: 'ok',
  }))
