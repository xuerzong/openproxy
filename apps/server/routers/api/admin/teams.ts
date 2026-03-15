import { Elysia, t } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  AdminTeamIdSchema,
  AdminTeamsQuerySchema,
  RechargeAdminTeamBodySchema,
  UpdateAdminTeamBodySchema,
  UpdateAdminTeamStatusBodySchema,
} from '@server/schemas'
import {
  deleteAdminTeam,
  getAdminTeamById,
  getAdminTeamMembers,
  getAdminTeams,
  getAdminTeamsCount,
  rechargeAdminTeam,
  resetAdminTeamInviteCode,
  setAdminTeamDisabled,
  updateAdminTeam,
} from '@server/services/team'

export const adminTeamsRouter = new Elysia({
  prefix: '/admin',
})
  .use(betterAuthPlugin)
  .get(
    '/teams',
    async ({ query }) => {
      return await getAdminTeams(query.limit, query.offset, query.keyword)
    },
    { auth: { role: 'admin' }, query: AdminTeamsQuerySchema }
  )
  .get(
    '/teams/count',
    async ({ query }) => {
      return await getAdminTeamsCount(query.keyword)
    },
    {
      auth: { role: 'admin' },
      query: t.Object({ keyword: t.Optional(t.String()) }),
    }
  )
  .get(
    '/teams/:id/members',
    async ({ params }) => {
      return await getAdminTeamMembers(params.id)
    },
    {
      auth: { role: 'admin' },
      params: AdminTeamIdSchema,
    }
  )
  .get(
    '/teams/:id',
    async ({ params, set }) => {
      const team = await getAdminTeamById(params.id)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      params: AdminTeamIdSchema,
    }
  )
  .put(
    '/teams',
    async ({ body, set }) => {
      const team = await updateAdminTeam(body)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      body: UpdateAdminTeamBodySchema,
    }
  )
  .post(
    '/teams/resetInviteCode',
    async ({ body, set }) => {
      const team = await resetAdminTeamInviteCode(body.id)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      body: AdminTeamIdSchema,
    }
  )
  .put(
    '/teams/status',
    async ({ body, set }) => {
      const team = await setAdminTeamDisabled(body.id, body.disabled)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      body: UpdateAdminTeamStatusBodySchema,
    }
  )
  .post(
    '/teams/recharge',
    async ({ body, set }) => {
      const team = await rechargeAdminTeam(body.id, body.amount)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      body: RechargeAdminTeamBodySchema,
    }
  )
  .delete(
    '/teams/:id',
    async ({ params, set }) => {
      const team = await deleteAdminTeam(params.id)

      if (!team) {
        set.status = 404
        return 'Team not found'
      }

      return team
    },
    {
      auth: { role: 'admin' },
      params: AdminTeamIdSchema,
    }
  )
