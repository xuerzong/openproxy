import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  getAccessTokensByTeamId,
  createAccessToken,
  deleteAccessToken,
  ACCESS_TOKEN_SCOPES,
} from '@server/services/access-token'
import {
  CreateAccessTokenBodySchema,
  AccessTokenIdParamSchema,
} from '@server/schemas/access-token'

export const accessTokensRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'accessTokens',
    async ({ teamId }) => {
      return await getAccessTokensByTeamId(teamId)
    },
    { auth: { role: true }, team: true }
  )
  .get('accessTokens/scopes', () => {
    return ACCESS_TOKEN_SCOPES
  })
  .post(
    'accessTokens',
    async ({ teamUserId, teamId, body, status }) => {
      const existing = await getAccessTokensByTeamId(teamId)
      if (existing.length >= 20) {
        return status(400, {
          message: 'Maximum 20 access tokens per team',
        })
      }

      try {
        const token = await createAccessToken({
          teamId,
          createdBy: teamUserId,
          name: body.name,
          scopes: body.scopes,
          expiresAt: body.expiresAt,
        })
        return { token }
      } catch (error: unknown) {
        return status(400, {
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    },
    {
      body: CreateAccessTokenBodySchema,
      auth: { role: true },
      team: true,
    }
  )
  .delete(
    'accessTokens/:id',
    async ({ teamId, params }) => {
      await deleteAccessToken(params.id, teamId)
    },
    {
      params: AccessTokenIdParamSchema,
      auth: { role: true },
      team: true,
    }
  )
