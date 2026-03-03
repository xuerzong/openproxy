import { Elysia, t } from 'elysia'
import omit from 'lodash/omit'
import { betterAuthPlugin } from '@server/routers/better-auth'
import {
  getApiKeysByTeamId,
  createApiKey,
  updateApiKey,
  deleteApiKey,
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
    { auth: { role: true, team: true } }
  )
  .post(
    'apiKeys',
    async ({ teamUserId, teamId, body, status }) => {
      try {
        const apiKey = await createApiKey({
          teamId,
          userId: teamUserId,
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
      auth: { role: true, team: true },
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
      auth: { role: true, team: true },
      body: UpdateApiKeyBodySchema,
    }
  )
  .delete(
    'apiKeys/:id',
    async ({ teamId, params }) => {
      await deleteApiKey(params.id, teamId)
    },
    { auth: { role: true, team: true } }
  )
