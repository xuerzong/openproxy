import { Elysia, t } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  ApiKeyFolderServiceError,
  getApiKeyFoldersByTeamIdAdmin,
  deleteApiKeyFolderAdmin,
} from '@server/services/api-key-folder'

export const adminApiKeyFoldersRouter = new Elysia({
  prefix: '/admin',
})
  .use(betterAuthPlugin)
  .get(
    '/folders',
    async ({ query }) => {
      return getApiKeyFoldersByTeamIdAdmin(query.teamId)
    },
    {
      auth: { role: 'admin' },
      query: t.Object({ teamId: t.String() }),
    }
  )
  .delete(
    '/folders/:id',
    async ({ params, set }) => {
      try {
        const folder = await deleteApiKeyFolderAdmin(params.id)
        if (!folder) {
          set.status = 404
          return 'Folder not found'
        }
        return folder
      } catch (error) {
        if (error instanceof ApiKeyFolderServiceError) {
          set.status = error.status
          return error.message
        }

        throw error
      }
    },
    {
      auth: { role: 'admin' },
      params: t.Object({ id: t.String() }),
    }
  )
