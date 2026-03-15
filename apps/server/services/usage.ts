import { and, count, desc, eq, gte, lt } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

const getUsageGroupingWindow = (rangeHours?: number, bucketCount?: number) => {
  const safeRangeHours =
    typeof rangeHours === 'number' && Number.isFinite(rangeHours)
      ? Math.min(Math.max(Math.floor(rangeHours), 1), 24 * 30)
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

const toGroupedUsageBuckets = (
  usageRows: Array<{
    createdAt: Date
    cost: unknown
    tokensPrompt: number
    tokensCompletion: number
  }>,
  alignedStartMs: number,
  bucketMs: number,
  effectiveBucketCount: number
) => {
  const aggregatedMap = new Map<
    number,
    {
      requests: number
      totalCost: number
      tokensPrompt: number
      tokensCompletion: number
    }
  >()

  for (const usage of usageRows) {
    const diffMs = usage.createdAt.getTime() - alignedStartMs
    const bucketIndex = Math.floor(diffMs / bucketMs)

    if (bucketIndex < 0 || bucketIndex >= effectiveBucketCount) {
      continue
    }

    const bucketAtMs = alignedStartMs + bucketIndex * bucketMs
    const current = aggregatedMap.get(bucketAtMs)

    if (current) {
      current.requests += 1
      current.totalCost += Number(usage.cost)
      current.tokensPrompt += usage.tokensPrompt
      current.tokensCompletion += usage.tokensCompletion
    } else {
      aggregatedMap.set(bucketAtMs, {
        requests: 1,
        totalCost: Number(usage.cost),
        tokensPrompt: usage.tokensPrompt,
        tokensCompletion: usage.tokensCompletion,
      })
    }
  }

  return Array.from({ length: effectiveBucketCount }, (_, index) => {
    const bucketAt = new Date(alignedStartMs + index * bucketMs)
    const usage = aggregatedMap.get(bucketAt.getTime())

    return {
      bucketAt,
      requests: usage ? Number(usage.requests) : 0,
      totalCost: usage ? Number(usage.totalCost) : 0,
      tokensPrompt: usage ? Number(usage.tokensPrompt) : 0,
      tokensCompletion: usage ? Number(usage.tokensCompletion) : 0,
    }
  })
}

export async function getUsagesByTeamId(
  teamId: string,
  limit: number,
  offset: number
) {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const usageList = await db
    .select({
      usage: dbSchema.usages,
      aiProvider: {
        name: dbSchema.aiProviders.name,
        icon: dbSchema.aiProviders.icon,
      },
    })
    .from(dbSchema.usages)
    .leftJoin(
      dbSchema.aiProviders,
      eq(dbSchema.usages.aiProviderId, dbSchema.aiProviders.id)
    )
    .where(
      and(
        eq(dbSchema.usages.teamId, teamId),
        gte(dbSchema.usages.createdAt, last24Hours),
        lt(dbSchema.usages.createdAt, now)
      )
    )
    .limit(limit)
    .offset(offset)
    .orderBy(desc(dbSchema.usages.createdAt))
  return usageList.map(({ usage, aiProvider }) => ({
    ...usage,
    cost: Number(usage.cost),
    aiProvider,
  }))
}

export async function getUsagesCountByTeamId(teamId: string) {
  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const result = await db
    .select({ count: count() })
    .from(dbSchema.usages)
    .where(
      and(
        eq(dbSchema.usages.teamId, teamId),
        gte(dbSchema.usages.createdAt, last24Hours)
      )
    )
  return result[0]?.count || 0
}

export async function getUsagesGroupedByTeamId(
  teamId: string,
  rangeHours?: number,
  bucketCount?: number
) {
  const {
    alignedStart,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount,
    rangeEnd,
  } = getUsageGroupingWindow(rangeHours, bucketCount)

  const usageRows = await db
    .select({
      createdAt: dbSchema.usages.createdAt,
      cost: dbSchema.usages.cost,
      tokensPrompt: dbSchema.usages.tokensPrompt,
      tokensCompletion: dbSchema.usages.tokensCompletion,
    })
    .from(dbSchema.usages)
    .where(
      and(
        eq(dbSchema.usages.teamId, teamId),
        gte(dbSchema.usages.createdAt, alignedStart),
        lt(dbSchema.usages.createdAt, rangeEnd)
      )
    )
    .orderBy(dbSchema.usages.createdAt)

  return toGroupedUsageBuckets(
    usageRows,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount
  )
}

export async function getUsagesGrouped(
  rangeHours?: number,
  bucketCount?: number
) {
  const {
    alignedStart,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount,
    rangeEnd,
  } = getUsageGroupingWindow(rangeHours, bucketCount)

  const usageRows = await db
    .select({
      createdAt: dbSchema.usages.createdAt,
      cost: dbSchema.usages.cost,
      tokensPrompt: dbSchema.usages.tokensPrompt,
      tokensCompletion: dbSchema.usages.tokensCompletion,
    })
    .from(dbSchema.usages)
    .where(
      and(
        gte(dbSchema.usages.createdAt, alignedStart),
        lt(dbSchema.usages.createdAt, rangeEnd)
      )
    )
    .orderBy(dbSchema.usages.createdAt)

  return toGroupedUsageBuckets(
    usageRows,
    alignedStartMs,
    bucketMs,
    effectiveBucketCount
  )
}
