import { and, count, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { supportedModelOwnedBy } from '@server/lib/const'
import { getUsagesGrouped } from './usage'

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

export async function getAdminDashboardUsageGrouped(
  rangeHours?: number,
  bucketCount?: number
) {
  return await getUsagesGrouped(rangeHours, bucketCount)
}

export async function getAdminDashboardUsageByModelGroup(rangeHours = 24) {
  const safeRangeHours = Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 30)
  const rangeStart = new Date(Date.now() - safeRangeHours * 60 * 60 * 1000)

  const rows = await db
    .select({
      modelGroup: dbSchema.usages.modelOwnedBy,
      requests: count(),
    })
    .from(dbSchema.usages)
    .where(gte(dbSchema.usages.createdAt, rangeStart))
    .groupBy(dbSchema.usages.modelOwnedBy)

  const requestsByGroup = new Map<string, number>()

  for (const row of rows) {
    const modelGroup = row.modelGroup?.trim() || 'other'
    const currentRequests = requestsByGroup.get(modelGroup) || 0

    requestsByGroup.set(modelGroup, currentRequests + Number(row.requests || 0))
  }

  const normalizedGroups = supportedModelOwnedBy.map((modelGroup) => ({
    modelGroup,
    requests: requestsByGroup.get(modelGroup) || 0,
  }))

  const extraGroups = Array.from(requestsByGroup.entries())
    .filter(([modelGroup]) => !supportedModelOwnedBy.includes(modelGroup))
    .map(([modelGroup, requests]) => ({ modelGroup, requests }))
    .sort((left, right) => right.requests - left.requests)

  return [...normalizedGroups, ...extraGroups]
}

export async function getAdminDashboardUsageByProvider(rangeHours = 24) {
  const safeRangeHours = Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 30)
  const rangeStart = new Date(Date.now() - safeRangeHours * 60 * 60 * 1000)

  const [providers, rows] = await Promise.all([
    db.query.aiProviders.findMany({
      columns: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    }),
    db
      .select({
        providerId: dbSchema.usages.aiProviderId,
        requests: count(),
      })
      .from(dbSchema.usages)
      .where(gte(dbSchema.usages.createdAt, rangeStart))
      .groupBy(dbSchema.usages.aiProviderId),
  ])

  const requestsByProviderId = new Map<string, number>()

  for (const row of rows) {
    const providerId = row.providerId?.trim() || ''
    const currentRequests = requestsByProviderId.get(providerId) || 0

    requestsByProviderId.set(
      providerId,
      currentRequests + Number(row.requests || 0)
    )
  }

  const normalizedProviders = providers.map((provider) => ({
    providerId: provider.id,
    providerName: provider.name,
    providerIcon: provider.icon,
    requests: requestsByProviderId.get(provider.id) || 0,
  }))

  const knownProviderIds = new Set(providers.map((provider) => provider.id))
  const extraProviders = Array.from(requestsByProviderId.entries())
    .filter(([providerId]) => providerId && !knownProviderIds.has(providerId))
    .map(([providerId, requests]) => ({
      providerId,
      providerName: providerId,
      providerIcon: '',
      requests,
    }))
    .sort((left, right) => right.requests - left.requests)

  return [...normalizedProviders, ...extraProviders]
}
