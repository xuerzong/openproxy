import { and, count, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function getAdminDashboardStats() {
  const { start, end } = getTodayRange()

  const [totalUsersResult, todayNewUsersResult, todayRechargeResult] =
    await Promise.all([
      db.select({ count: count() }).from(dbSchema.users),
      db
        .select({ count: count() })
        .from(dbSchema.users)
        .where(
          and(
            gte(dbSchema.users.createdAt, start),
            lt(dbSchema.users.createdAt, end)
          )
        ),
      db
        .select({
          amount: sql<string>`coalesce(sum(${dbSchema.orders.amount}), 0)`,
        })
        .from(dbSchema.orders)
        .where(
          and(
            gte(dbSchema.orders.createdAt, start),
            lt(dbSchema.orders.createdAt, end),
            inArray(dbSchema.orders.status, [1, 2])
          )
        ),
    ])

  const minuteAgo = new Date(Date.now() - 60 * 1000)
  const [realtimeUsageResult] = await db
    .select({
      rpm: count(),
      tpm: sql<number>`coalesce(sum(${dbSchema.usages.tokensPrompt} + ${dbSchema.usages.tokensCompletion}), 0)`,
    })
    .from(dbSchema.usages)
    .where(gte(dbSchema.usages.createdAt, minuteAgo))

  return {
    users: {
      total: totalUsersResult[0]?.count || 0,
      todayNew: todayNewUsersResult[0]?.count || 0,
    },
    recharge: {
      todayAmount: Number(todayRechargeResult[0]?.amount || 0),
    },
    usage: {
      rpm: realtimeUsageResult?.rpm || 0,
      tpm: Number(realtimeUsageResult?.tpm || 0),
      windowMinutes: 1,
    },
  }
}
