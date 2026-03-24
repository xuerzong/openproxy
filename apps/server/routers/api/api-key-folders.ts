import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  getApiKeyFoldersByTeamId,
  getApiKeyFolderCountByTeamId,
  createApiKeyFolder,
  updateApiKeyFolder,
  deleteApiKeyFolder,
  ApiKeyFolderServiceError,
} from '@server/services/api-key-folder'
import {
  CreateApiKeyFolderBodySchema,
  UpdateApiKeyFolderBodySchema,
} from '@server/schemas'
import { IS_OSS, TeamPlanLimits } from '@server/constants'
import type { TeamPlan } from '@server/constants'

export const apiKeyFoldersRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'apiKeyFolders',
    async ({ teamId }) => {
      return getApiKeyFoldersByTeamId(teamId)
    },
    { auth: { role: true }, team: true }
  )
  .post(
    'apiKeyFolders',
    async ({ teamId, team, body, status }) => {
      const folderCount = await getApiKeyFolderCountByTeamId(teamId)
      const plan = (team.plan || 'free') as TeamPlan
      const limit = TeamPlanLimits[plan]?.folderLimit ?? 1
      if (!IS_OSS && folderCount >= limit) {
        return status(422, {
          code: 'FOLDER_LIMIT_EXCEEDED',
          message: `Folder limit reached (${limit})`,
        })
      }
      return createApiKeyFolder({
        teamId,
        name: body.name,
        isDefault: body.isDefault,
      })
    },
    {
      body: CreateApiKeyFolderBodySchema,
      auth: { role: true },
      team: true,
    }
  )
  .put(
    'apiKeyFolders',
    async ({ teamId, body, status }) => {
      const folder = await updateApiKeyFolder({
        id: body.id,
        teamId,
        name: body.name,
        isDefault: body.isDefault,
      })
      if (!folder) {
        return status(404, { message: 'Folder not found' })
      }
      return folder
    },
    {
      body: UpdateApiKeyFolderBodySchema,
      auth: { role: true },
      team: true,
    }
  )
  .delete(
    'apiKeyFolders/:id',
    async ({ teamId, params, status }) => {
      try {
        const folder = await deleteApiKeyFolder(params.id, teamId)
        if (!folder) {
          return status(404, { message: 'Folder not found' })
        }
        return folder
      } catch (error) {
        if (error instanceof ApiKeyFolderServiceError) {
          return status(error.status, { message: error.message })
        }

        throw error
      }
    },
    { auth: { role: true }, team: true }
  )
