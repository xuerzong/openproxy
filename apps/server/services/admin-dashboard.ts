import { and, count, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { supportedModelOwnedBy } from '@server/lib/const'
import { getUsagesGrouped } from './usage'

const getDashboardUsageGroupingWindow = (
  rangeHours?: number,
  bucketCount?: number
) => {
  const safeRangeHours =
    typeof rangeHours === 'number' && Number.isFinite(rangeHours)
      ? Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 365)
      : 24
  const effectiveBucketCount =
    typeof bucketCount === 'number' && Number.isFinite(bucketCount)
      ? Math.min(Math.max(Math.floor(bucketCount), 1), 1000)
      : 24
  const rangeMs = safeRangeHours * 60 * 60 * 1000
  const bucketMs = rangeMs / effectiveBucketCount
  const rangeEnd = new Date()
  const alignedStartMs = rangeEnd.getTime() - rangeMs

  return {
    alignedStart: new Date(alignedStartMs),
    alignedStartMs,
    bucketMs,
    effectiveBucketCount,
    rangeEnd,
  }
}

const groupDashboardUsageByBucketAndKey = <T extends { createdAt: Date }>(
  rows: T[],
  getKey: (row: T) => string,
  alignedStartMs: number,
  bucketMs: number,
  effectiveBucketCount: number
) => {
  const grouped = new Map<
    string,
    { bucketAt: Date; key: string; requests: number }
  >()

  for (const row of rows) {
    const diffMs = row.createdAt.getTime() - alignedStartMs
    const bucketIndex = Math.floor(diffMs / bucketMs)

    if (bucketIndex < 0 || bucketIndex >= effectiveBucketCount) {
      continue
    }

    const bucketAtMs = alignedStartMs + bucketIndex * bucketMs
    const bucketAt = new Date(bucketAtMs)
    const key = getKey(row)
    const groupedKey = `${bucketAtMs}:${key}`
    const current = grouped.get(groupedKey)

    if (current) {
      current.requests += 1
    } else {
      grouped.set(groupedKey, {
        bucketAt,
        key,
        requests: 1,
      })
    }
  }

  return Array.from(grouped.values()).sort(
    (left, right) => left.bucketAt.getTime() - right.bucketAt.getTime()
  )
}

const getTodayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export const getAdminDashboardStats = async () => {
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

export const getAdminDashboardUsageGrouped = async (
  rangeHours?: number,
  bucketCount?: number
) => {
  return await getUsagesGrouped(rangeHours, bucketCount)
}

export const getAdminDashboardUsageByModelGroup = async (rangeHours = 24) => {
  const safeRangeHours = Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 365)
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

export const getAdminDashboardUsageByProvider = async (rangeHours = 24) => {
  const safeRangeHours = Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 365)
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

export const getAdminDashboardUsageByModelGroupGrouped = async (
  rangeHours?: number,
  bucketCount?: number
) => {
  const {
    alignedStart,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount,
    rangeEnd,
  } = getDashboardUsageGroupingWindow(rangeHours, bucketCount)
  const rows = await db
    .select({
      createdAt: dbSchema.usages.createdAt,
      modelGroup: dbSchema.usages.modelOwnedBy,
    })
    .from(dbSchema.usages)
    .where(
      and(
        gte(dbSchema.usages.createdAt, alignedStart),
        lt(dbSchema.usages.createdAt, rangeEnd)
      )
    )
    .orderBy(dbSchema.usages.createdAt)
  return groupDashboardUsageByBucketAndKey(
    rows,
    (row) => row.modelGroup?.trim() || 'other',
    alignedStartMs,
    bucketMs,
    effectiveBucketCount
  ).map((row) => ({
    bucketAt: row.bucketAt,
    modelGroup: row.key,
    requests: row.requests,
  }))
}

export const getAdminDashboardUsageByProviderGrouped = async (
  rangeHours?: number,
  bucketCount?: number
) => {
  const {
    alignedStart,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount,
    rangeEnd,
  } = getDashboardUsageGroupingWindow(rangeHours, bucketCount)
  const [providers, rows] = await Promise.all([
    db.query.aiProviders.findMany({
      columns: {
        id: true,
        name: true,
      },
    }),
    db
      .select({
        createdAt: dbSchema.usages.createdAt,
        providerId: dbSchema.usages.aiProviderId,
      })
      .from(dbSchema.usages)
      .where(
        and(
          gte(dbSchema.usages.createdAt, alignedStart),
          lt(dbSchema.usages.createdAt, rangeEnd)
        )
      )
      .orderBy(dbSchema.usages.createdAt),
  ])
  const providerNameMap = new Map(
    providers.map((provider) => [provider.id, provider.name])
  )
  return groupDashboardUsageByBucketAndKey(
    rows,
    (row) => row.providerId?.trim() || 'unknown',
    alignedStartMs,
    bucketMs,
    effectiveBucketCount
  ).map((row) => ({
    bucketAt: row.bucketAt,
    providerId: row.key,
    providerName: providerNameMap.get(row.key) || row.key || 'Unknown',
    requests: row.requests,
  }))
}
