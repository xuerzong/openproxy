import { Elysia } from 'elysia'
import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { PayStatus } from '@server/constants/pay'
import { createTeam } from '@server/services/team'
import { archiveMonthlyUsages } from '@server/services/usage'

const BEARER_PREFIX = 'Bearer '

export const cronRouter = new Elysia({
  prefix: '/cron',
})
  .onBeforeHandle(({ request, set }) => {
    const cronSecret = process.env.CRON_SECRET?.trim()

    if (!cronSecret) {
      set.status = 500
      throw new Error('CRON_SECRET is not configured')
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith(BEARER_PREFIX)) {
      set.status = 401
      throw new Error('Missing or invalid Authorization header')
    }

    const token = authHeader.slice(BEARER_PREFIX.length).trim()
    if (token !== cronSecret) {
      set.status = 401
      throw new Error('Invalid cron access token')
    }
  })
  .post('/cleanupOrder', async () => {
    await db
      .update(dbSchema.orders)
      .set({
        status: PayStatus.CANCELED,
      })
      .where(
        and(
          eq(dbSchema.orders.status, PayStatus.PENDING), // Must be pending payment status
          lt(dbSchema.orders.createdAt, new Date(Date.now() - 15 * 60 * 1000)) // Must be created more than 15 minutes ago
        )
      )

    return { success: true }
  })
  .post('resetMonthlyFree', async () => {
    // Update at 00:00 on the 1st of each month
    await db
      .update(dbSchema.userConfigs)
      .set({
        // monthlyFreeAllowance: '5.00', // No need to recharge free quota
        monthlyFreeUsed: '0',
        monthlyFreeLastResetAt: sql`now()`,
      })
      .where(
        // Last reset time < 00:00:00 on the 1st of current month
        lt(
          dbSchema.userConfigs.monthlyFreeLastResetAt,
          sql`date_trunc('month', now())`
        )
      )

    return { success: true }
  })
  .post('/archiveMonthlyUsage', async () => {
    const result = await archiveMonthlyUsages()

    return {
      success: true,
      ...result,
    }
  })
  .post('/syncTeamToUser', async () => {
    const users = await db.query.users.findMany({
      with: {
        teams: true,
        config: true,
      },
    })

    await Promise.all(
      users
        .filter((user) => user.teams.length === 0)
        .map((user) => {
          return createTeam(user.id)
        })
    )
  })
