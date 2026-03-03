import { getUserTeamById } from '@server/services/user'
import type { BetterAuthPlugin } from 'better-auth'
import { createAuthEndpoint } from 'better-auth/api'
import { z } from 'zod'

export const teamPlugin = {
  id: 'team',
  endpoints: {
    changeTeam: createAuthEndpoint(
      '/change-team',
      {
        method: 'POST',
        body: z.object({ teamId: z.string() }),
      },
      async (ctx) => {
        const session = ctx.context.session
        if (!session) {
          return ctx.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userTeam = await getUserTeamById(session.user.id, ctx.body.teamId)
        if (!userTeam) {
          return ctx.json({ error: 'Team Not Found' }, { status: 404 })
        }
        await ctx.context.internalAdapter.updateSession(session.session.token, {
          teamId: ctx.body.teamId,
        })
        return ctx.json({ success: true })
      }
    ),
  },
} satisfies BetterAuthPlugin
