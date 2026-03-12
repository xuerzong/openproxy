import { Elysia, t } from 'elysia'
import omit from 'lodash/omit'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  getApiKeysByTeamId,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getApiKeyCountByTeamId,
} from '@server/services/api-key'
import { CreateApiKeyBodySchema, UpdateApiKeyBodySchema } from '@server/schemas'

export const apiKeysRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'apiKeys',
    async ({ teamId }) => {
      const apiKeys = await getApiKeysByTeamId(teamId)

      return apiKeys.map((apiKey) => ({
        ...omit(apiKey, 'apiKeyHash', 'apiKeysToModels'),
        modelIds: apiKey.modelIds,
        maxQuota: apiKey.maxQuota,
      }))
    },
    { auth: { role: true }, team: true }
  )
  .post(
    'apiKeys',
    async ({ teamUserId, teamId, team, body, status }) => {
      try {
        const hasCreatedApiKeyCount = await getApiKeyCountByTeamId(teamId)
        if (hasCreatedApiKeyCount >= team.apiKeyLimit) {
          return status(422, {
            code: 'API_KEY_LIMIT_EXCEEDED',
            message: `每个用户最多只能创建 ${team.apiKeyLimit} 个 API Key`,
          })
        }
        const apiKey = await createApiKey({
          teamId,
          teamUserId,
          name: body.name,
          expiresAt: body.expiresAt,
          maxQuota: body.maxQuota,
          maxRequests: body.maxRequests,
          modelIds: body.modelIds,
        })
        return apiKey
      } catch (error: any) {
        return status(400, {
          message: error.message,
        })
      }
    },
    {
      body: CreateApiKeyBodySchema,
      auth: { role: true },
      team: true,
    }
  )
  .put(
    'apiKeys',
    async ({ user, teamId, body, status }) => {
      try {
        await updateApiKey({
          id: body.id,
          teamId,
          name: body.name,
          expiresAt: body.expiresAt,
          maxQuota: body.maxQuota,
          maxRequests: body.maxRequests,
          modelIds: body.modelIds,
        })
        return ''
      } catch (error: any) {
        return status(401, {
          message: error.message,
        })
      }
    },
    {
      auth: { role: true },
      team: true,
      body: UpdateApiKeyBodySchema,
    }
  )
  .delete(
    'apiKeys/:id',
    async ({ teamId, params }) => {
      await deleteApiKey(params.id, teamId)
    },
    { auth: { role: true }, team: true }
  )
