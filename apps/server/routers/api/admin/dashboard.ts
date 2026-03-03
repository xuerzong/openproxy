import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/routers/better-auth'
import { getAdminDashboardStats } from '@server/services/admin-dashboard'

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
