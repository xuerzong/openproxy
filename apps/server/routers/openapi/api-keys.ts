import { Elysia, t } from 'elysia'
import { openApiAuthPlugin } from '@server/plugins/openapi-auth'
import {
  getApiKeysByTeamId,
  createApiKey,
  deleteApiKey,
} from '@server/services/api-key'
import omit from 'lodash/omit'

export const openApiApiKeysRouter = new Elysia({ prefix: '/api-keys' })
  .use(openApiAuthPlugin)
  .get(
    '/',
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
    '/',
    async ({ accessToken, body, set }) => {
      try {
        const apiKey = await createApiKey({
          teamId: accessToken.teamId,
          teamUserId: '',
          name: body.name,
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
        expiresAt: t.Optional(t.Nullable(t.Date())),
        maxQuota: t.Optional(t.Numeric({ minimum: 0 })),
        maxRequests: t.Optional(t.Number({ minimum: 0 })),
        modelIds: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .delete(
    '/:id',
    async ({ accessToken, params }) => {
      await deleteApiKey(params.id, accessToken.teamId)
    },
    { openapi: { scope: 'api_keys:write' } }
  )
