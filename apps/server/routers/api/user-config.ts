import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { getUserConfigWithBalance } from '@server/services/user'
import {
  getOrdersByTeamId,
  getOrdersCountByTeamId,
} from '@server/services/order'
import { PaginationQuerySchema } from '@server/schemas'
import { getTeamById } from '@server/services/team'

export const userConfigRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'userConfig',
    async ({ user }) => {
      return await getUserConfigWithBalance(user.id)
    },
    { auth: { role: true } }
  )
  .get(
    'orders',
    async ({ teamId, query }) => {
      return await getOrdersByTeamId(teamId, query.limit, query.offset)
    },
    { auth: { role: true }, team: true, query: PaginationQuerySchema }
  )
  .get(
    'orders/count',
    async ({ teamId }) => {
      return await getOrdersCountByTeamId(teamId)
    },
    { auth: { role: true }, team: true }
  )
  .get(
    'team',
    async ({ teamUserId, teamId, set }) => {
      const team = await getTeamById(teamUserId, teamId)
      if (!team) {
        set.status = 404
        throw new Error('NOT_FOUND')
      }
      return team
    },
    { auth: { role: true }, team: true }
  )
