import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { openApiApiKeysRouter } from './api-keys'
import { openApiBalanceRouter } from './balance'

export const openApiRouter = new Elysia({ prefix: '/openapi' })
  .use(
    swagger({
      path: '/swagger',
      exclude: [/^(?!\/openapi)/],
      documentation: {
        info: {
          title: 'OpenProxy API',
          version: '1.0.0',
          description: 'OpenProxy OpenAPI — manage API keys and query balance',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              description: 'Team access token (oat-...)',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    })
  )
  .use(openApiApiKeysRouter)
  .use(openApiBalanceRouter)
