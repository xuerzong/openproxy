import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/routers/better-auth'
import { PaginationQuerySchema, UsageGroupedQuerySchema } from '@server/schemas'
import {
  getUsagesByTeamId,
  getUsagesCountByTeamId,
  getUsagesGroupedByTeamId,
} from '@server/services/usage'

export const usagesRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'usages',
    async ({ teamId, query }) => {
      return await getUsagesByTeamId(teamId, query.limit, query.offset)
    },
    {
      auth: { role: true, team: true },
      query: PaginationQuerySchema,
    }
  )
  .get(
    'usagesGrouped',
    async ({ teamId, query }) => {
      return await getUsagesGroupedByTeamId(
        teamId,
        query.rangeHours,
        query.bucketCount
      )
    },
    {
      auth: { role: true, team: true },
      query: UsageGroupedQuerySchema,
    }
  )
  .get(
    'usagesTotal',
    async ({ teamId }) => {
      return await getUsagesCountByTeamId(teamId)
    },
    {
      auth: { role: true, team: true },
    }
  )
