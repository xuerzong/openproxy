import { Elysia } from 'elysia'
import { betterAuthPlugin } from '../better-auth'
import { payRouter } from '../pay'
import { apiKeysRouter } from './api-keys'
import { userConfigRouter } from './user-config'
import { modelsRouter } from './models'
import { constsRouter } from './consts'
import { aiProvidersRouter } from './ai-providers'
import { usagesRouter } from './usages'
import {
  adminDashboardRouter,
  adminOrdersRouter,
  adminUsersRouter,
} from './admin'

export const apiRouter = new Elysia({
  prefix: '/api',
})
  .use(betterAuthPlugin)
  .use(apiKeysRouter)
  .use(userConfigRouter)
  .use(adminUsersRouter)
  .use(modelsRouter)
  .use(constsRouter)
  .use(payRouter)
  .use(aiProvidersRouter)
  .use(usagesRouter)
  .use(adminDashboardRouter)
  .use(adminOrdersRouter)
