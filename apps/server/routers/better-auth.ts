import { Elysia, t } from 'elysia'
import { auth } from '@server/lib/auth'
import { getUserTeamById } from '@server/services/user'
import { getTeams } from '@server/services/team'

export const betterAuthPlugin = new Elysia({
  name: 'better-auth-plugin',
}).macro({
  auth: <T extends { role?: boolean | 'admin'; team?: boolean }>({
    role,
    team,
  }: T) => ({
    resolve: async ({ set, request: { headers, url } }) => {
      const session = await auth.api.getSession({ headers })
      if (!session) {
        set.status = 401
        throw new Error('Unauthorized')
      }

      if (role === 'admin') {
        if (session.user.role !== 'admin') {
          set.status = 403
          throw new Error('Forbidden')
        }
      }

      const userId = session.user.id
      const teamId = session.session.teamId || ''

      if (/^[a-z0-9-]+$/.test(teamId) && team) {
        const userTeam = await getUserTeamById(userId, teamId)
        if (!userTeam) {
          set.status = 404
          throw new Error('Team Not Found')
        }

        return {
          ...session,
          teamUserId: userTeam.id,
          teamId: teamId,
        }
      }

      return { ...session, teamUserId: session.user.id, teamId: '' }
    },
  }),
})

export const betterAuthRouter = new Elysia({
  name: 'better-auth',
})
  .use(betterAuthPlugin)
  .mount(auth.handler)
  .get(
    '/api/auth/teams',
    async ({ user }) => {
      return getTeams(user.id)
    },
    { auth: { role: true } }
  )
