import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { openApiAuthPlugin } from '@server/plugins/openapi-auth'
import {
  getApiKeysByTeamId,
  createApiKey,
  deleteApiKey,
} from '@server/services/api-key'
import omit from 'lodash/omit'
import { eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import Decimal from 'decimal.js'

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
  .use(openApiAuthPlugin)
  .get(
    '/api-keys',
    async ({ accessToken }) => {
      const apiKeys = await getApiKeysByTeamId(accessToken.teamId)
      return apiKeys.map((apiKey) => ({
        ...omit(apiKey, 'apiKeyHash', 'apiKeysToModels'),
        modelIds: apiKey.modelIds,
        maxQuota: apiKey.maxQuota,
      }))
    },
    { openapi: { scope: 'api_keys:read' } }
  )
  .post(
    '/api-keys',
    async ({ accessToken, body, set }) => {
      try {
        const apiKey = await createApiKey({
          teamId: accessToken.teamId,
          teamUserId: '',
          name: body.name,
          folderId: body.folderId,
          expiresAt: body.expiresAt ?? null,
          maxQuota: body.maxQuota,
          maxRequests: body.maxRequests,
          modelIds: body.modelIds ?? [],
        })
        return { apiKey }
      } catch (error: unknown) {
        set.status = 400
        throw new Error(
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
    },
    {
      openapi: { scope: 'api_keys:write' },
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 32 }),
        folderId: t.String({ minLength: 1 }),
        expiresAt: t.Optional(t.Nullable(t.Date())),
        maxQuota: t.Optional(t.Numeric({ minimum: 0 })),
        maxRequests: t.Optional(t.Number({ minimum: 0 })),
        modelIds: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .delete(
    '/api-keys/:id',
    async ({ accessToken, params }) => {
      await deleteApiKey(params.id, accessToken.teamId)
    },
    { openapi: { scope: 'api_keys:write' } }
  )
  .get(
    '/balance',
    async ({ accessToken }) => {
      return await getTeamBalance(accessToken.teamId)
    },
    { openapi: { scope: 'balance:read' } }
  )

const getTeamBalance = async (teamId: string) => {
  const team = await db.query.teams.findFirst({
    where: eq(dbSchema.teams.id, teamId),
    columns: { id: true, amount: true },
  })

  if (!team) {
    throw new Error('Team not found')
  }

  return {
    teamId: team.id,
    balance: new Decimal(team.amount).toFixed(2),
  }
}
