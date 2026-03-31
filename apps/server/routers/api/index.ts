import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { payRouter } from '../pay'
import { apiKeysRouter } from './api-keys'
import { apiKeyFoldersRouter } from './api-key-folders'
import { userConfigRouter } from './user-config'
import { modelsRouter } from './models'
import { constsRouter } from './consts'
import { aiProvidersRouter } from './ai-providers'
import { usagesRouter } from './usages'
import { teamRouter } from './team'
import { accessTokensRouter } from './access-tokens'
import {
  adminDashboardRouter,
  adminOrdersRouter,
  adminTeamsRouter,
  adminUsersRouter,
  adminApiKeyFoldersRouter,
} from './admin'

export const apiRouter = new Elysia({
  prefix: '/api',
})
  .use(betterAuthPlugin)
  .use(apiKeysRouter)
  .use(apiKeyFoldersRouter)
  .use(userConfigRouter)
  .use(adminUsersRouter)
  .use(modelsRouter)
  .use(constsRouter)
  .use(payRouter)
  .use(aiProvidersRouter)
  .use(usagesRouter)
  .use(teamRouter)
  .use(accessTokensRouter)
  .use(adminDashboardRouter)
  .use(adminOrdersRouter)
  .use(adminTeamsRouter)
  .use(adminApiKeyFoldersRouter)
