import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { payRouter } from '../pay'
import { apiKeysRouter } from './api-keys'
import { userConfigRouter } from './user-config'
import { modelsRouter } from './models'
import { constsRouter } from './consts'
import { aiProvidersRouter } from './ai-providers'
import { providersRouter } from './providers'
import { usagesRouter } from './usages'
import { teamRouter } from './team'
import { accessTokensRouter } from './access-tokens'
import {
  adminDashboardRouter,
  adminOrdersRouter,
  adminTeamsRouter,
  adminUsersRouter,
} from './admin'
import { announcementRouter } from './announcement'

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
  .use(providersRouter)
  .use(usagesRouter)
  .use(teamRouter)
  .use(accessTokensRouter)
  .use(adminDashboardRouter)
  .use(adminOrdersRouter)
  .use(adminTeamsRouter)
  .use(announcementRouter)
