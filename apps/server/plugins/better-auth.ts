import { Elysia } from 'elysia'
import { auth } from '@server/lib/auth'
import { getUserTeamById } from '@server/services/user'

const getSessionOrThrow = async (
  headers: Headers,
  set: { status?: number | string },
  role?: boolean | 'admin'
) => {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    set.status = 401
    throw new Error('Unauthorized')
  }

  if (role === 'admin' && session.user.role !== 'admin') {
    set.status = 403
    throw new Error('Forbidden')
  }

  return session
}

export const betterAuthLoginPlugin = new Elysia({
  name: 'better-auth-login-plugin',
}).macro({
  auth: <T extends { role?: boolean | 'admin' }>({ role }: T) => ({
    resolve: async ({ set, request: { headers } }) => {
      return await getSessionOrThrow(headers, set, role)
    },
  }),
})

export const betterAuthTeamPlugin = new Elysia({
  name: 'better-auth-team-plugin',
}).macro({
  team: (enabled: boolean) => ({
    resolve: async ({ set, request: { headers } }) => {
      if (!enabled) {
        return
      }

      const session = await getSessionOrThrow(headers, set)
      const userId = session.user.id
      const teamId = session.session.teamId || ''

      if (!/^[a-z0-9-]+$/.test(teamId)) {
        set.status = 404
        throw new Error('Team Not Found')
      }

      const userTeam = await getUserTeamById(userId, teamId)
      if (!userTeam) {
        set.status = 404
        throw new Error('Team Not Found')
      }

      return {
        team: userTeam.team,
        teamUserId: userTeam.id,
        teamId,
      }
    },
  }),
})

export const betterAuthPlugin = new Elysia({
  name: 'better-auth-plugin',
})
  .use(betterAuthLoginPlugin)
  .use(betterAuthTeamPlugin)
