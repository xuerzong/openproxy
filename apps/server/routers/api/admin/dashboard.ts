import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { UsageGroupedQuerySchema } from '@server/schemas'
import {
  getAdminDashboardStats,
  getAdminDashboardUsageByModelGroup,
  getAdminDashboardUsageByModelGroupGrouped,
  getAdminDashboardUsageByProvider,
  getAdminDashboardUsageByProviderGrouped,
  getAdminDashboardUsageGrouped,
} from '@server/services/admin-dashboard'

export const adminDashboardRouter = new Elysia({
  prefix: '/admin',
})
  .use(betterAuthPlugin)
  .get(
    '/dashboard/stats',
    async () => {
      return await getAdminDashboardStats()
    },
    {
      auth: { role: 'admin' },
    }
  )
  .get(
    '/dashboard/usagesGrouped',
    async ({ query }) => {
      return await getAdminDashboardUsageGrouped(
        query.rangeHours,
        query.bucketCount
      )
    },
    {
      auth: { role: 'admin' },
      query: UsageGroupedQuerySchema,
    }
  )
  .get(
    '/dashboard/usagesByModelGroup',
    async ({ query }) => {
      return await getAdminDashboardUsageByModelGroup(query.rangeHours)
    },
    {
      auth: { role: 'admin' },
      query: UsageGroupedQuerySchema,
    }
  )
  .get(
    '/dashboard/usagesByModelGroupGrouped',
    async ({ query }) => {
      return await getAdminDashboardUsageByModelGroupGrouped(
        query.rangeHours,
        query.bucketCount
      )
    },
    {
      auth: { role: 'admin' },
      query: UsageGroupedQuerySchema,
    }
  )
  .get(
    '/dashboard/usagesByProvider',
    async ({ query }) => {
      return await getAdminDashboardUsageByProvider(query.rangeHours)
    },
    {
      auth: { role: 'admin' },
      query: UsageGroupedQuerySchema,
    }
  )
  .get(
    '/dashboard/usagesByProviderGrouped',
    async ({ query }) => {
      return await getAdminDashboardUsageByProviderGrouped(
        query.rangeHours,
        query.bucketCount
      )
    },
    {
      auth: { role: 'admin' },
      query: UsageGroupedQuerySchema,
    }
  )
