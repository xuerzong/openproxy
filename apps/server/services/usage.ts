import { and, count, desc, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

type MonthlyUsageModelBreakdown = {
  modelName: string
  requests: number
  totalCost: number
  tokensPrompt: number
  tokensCompletion: number
}

const startOfMonth = (value: Date) => {
  const result = new Date(value)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

const endOfMonth = (value: Date) => {
  const result = new Date(value)
  result.setMonth(result.getMonth() + 1)
  return result
}

const toDate = (value: Date | string) => {
  return value instanceof Date ? value : new Date(value)
}

const toMonthKey = (teamId: string, monthStart: Date) => {
  return `${teamId}:${monthStart.toISOString()}`
}

const toMonthlyUsageView = (
  row: typeof dbSchema.teamMonthlyUsages.$inferSelect
) => {
  const totalRequests = Number(row.totalRequests || 0)
  const tokensPrompt = Number(row.tokensPrompt || 0)
  const tokensCompletion = Number(row.tokensCompletion || 0)

  return {
    ...row,
    totalCost: Number(row.totalCost),
    totalRequests,
    tokensPrompt,
    tokensCompletion,
    totalTokens: tokensPrompt + tokensCompletion,
    modelBreakdown: (row.modelBreakdown || []).map((item) => ({
      ...item,
      totalCost: Number(item.totalCost || 0),
      totalTokens:
        Number(item.tokensPrompt || 0) + Number(item.tokensCompletion || 0),
      requestShare:
        totalRequests > 0 ? Number(item.requests || 0) / totalRequests : 0,
    })),
  }
}

const createCurrentMonthUsageView = (params: {
  teamId: string
  monthStart: Date
  monthEnd: Date
  totalRequests: number
  totalCost: number
  tokensPrompt: number
  tokensCompletion: number
  modelBreakdown: MonthlyUsageModelBreakdown[]
}) => {
  const totalTokens = params.tokensPrompt + params.tokensCompletion

  return {
    id: `current:${params.teamId}:${params.monthStart.toISOString()}`,
    teamId: params.teamId,
    monthStart: params.monthStart,
    monthEnd: params.monthEnd,
    totalRequests: params.totalRequests,
    totalCost: params.totalCost,
    tokensPrompt: params.tokensPrompt,
    tokensCompletion: params.tokensCompletion,
    totalTokens,
    modelBreakdown: params.modelBreakdown.map((item) => ({
      ...item,
      totalTokens: item.tokensPrompt + item.tokensCompletion,
      requestShare:
        params.totalRequests > 0 ? item.requests / params.totalRequests : 0,
    })),
    createdAt: params.monthStart,
    updatedAt: new Date(),
  }
}

const getUsageGroupingWindow = (rangeHours?: number, bucketCount?: number) => {
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

export const getUsagesByTeamId = async (
  teamId: string,
  limit: number,
  offset: number
) => {
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

export const getUsagesCountByTeamId = async (teamId: string) => {
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

export const getUsagesGroupedByTeamId = async (
  teamId: string,
  rangeHours?: number,
  bucketCount?: number
) => {
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

export const getUsagesGrouped = async (
  rangeHours?: number,
  bucketCount?: number
) => {
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

export const getTeamMonthlyUsagesByTeamId = async (
  teamId: string,
  limit = 12
) => {
  const currentMonthStart = startOfMonth(new Date())
  const currentMonthEnd = endOfMonth(currentMonthStart)
  const [archivedRows, currentSummaryRows, currentModelRows] =
    await Promise.all([
      db.query.teamMonthlyUsages.findMany({
        where: and(
          eq(dbSchema.teamMonthlyUsages.teamId, teamId),
          lt(dbSchema.teamMonthlyUsages.monthStart, currentMonthStart)
        ),
        orderBy: desc(dbSchema.teamMonthlyUsages.monthStart),
        limit: Math.max(limit - 1, 0),
      }),
      db
        .select({
          totalRequests: count(),
          totalCost: sql<string>`coalesce(sum(${dbSchema.usages.cost}), 0)`,
          tokensPrompt: sql<number>`coalesce(sum(${dbSchema.usages.tokensPrompt}), 0)`,
          tokensCompletion: sql<number>`coalesce(sum(${dbSchema.usages.tokensCompletion}), 0)`,
        })
        .from(dbSchema.usages)
        .where(
          and(
            eq(dbSchema.usages.teamId, teamId),
            gte(dbSchema.usages.createdAt, currentMonthStart),
            lt(dbSchema.usages.createdAt, currentMonthEnd)
          )
        ),
      db
        .select({
          modelName: dbSchema.usages.modelName,
          requests: count(),
          totalCost: sql<string>`coalesce(sum(${dbSchema.usages.cost}), 0)`,
          tokensPrompt: sql<number>`coalesce(sum(${dbSchema.usages.tokensPrompt}), 0)`,
          tokensCompletion: sql<number>`coalesce(sum(${dbSchema.usages.tokensCompletion}), 0)`,
        })
        .from(dbSchema.usages)
        .where(
          and(
            eq(dbSchema.usages.teamId, teamId),
            gte(dbSchema.usages.createdAt, currentMonthStart),
            lt(dbSchema.usages.createdAt, currentMonthEnd)
          )
        )
        .groupBy(dbSchema.usages.modelName),
    ])
  const currentSummary = currentSummaryRows[0]
  const currentMonthUsage = createCurrentMonthUsageView({
    teamId,
    monthStart: currentMonthStart,
    monthEnd: currentMonthEnd,
    totalRequests: Number(currentSummary?.totalRequests || 0),
    totalCost: Number(currentSummary?.totalCost || 0),
    tokensPrompt: Number(currentSummary?.tokensPrompt || 0),
    tokensCompletion: Number(currentSummary?.tokensCompletion || 0),
    modelBreakdown: currentModelRows
      .map((row) => ({
        modelName: row.modelName || 'unknown',
        requests: Number(row.requests || 0),
        totalCost: Number(row.totalCost || 0),
        tokensPrompt: Number(row.tokensPrompt || 0),
        tokensCompletion: Number(row.tokensCompletion || 0),
      }))
      .sort((left, right) => right.requests - left.requests),
  })
  return [currentMonthUsage, ...archivedRows.map(toMonthlyUsageView)]
}

export const archiveMonthlyUsages = async () => {
  const currentMonthStart = startOfMonth(new Date())
  const [summaryRows, modelRows] = await Promise.all([
    db
      .select({
        teamId: dbSchema.usages.teamId,
        monthStart: sql<string>`date_trunc('month', ${dbSchema.usages.createdAt})`,
        totalRequests: count(),
        totalCost: sql<string>`coalesce(sum(${dbSchema.usages.cost}), 0)`,
        tokensPrompt: sql<number>`coalesce(sum(${dbSchema.usages.tokensPrompt}), 0)`,
        tokensCompletion: sql<number>`coalesce(sum(${dbSchema.usages.tokensCompletion}), 0)`,
      })
      .from(dbSchema.usages)
      .where(lt(dbSchema.usages.createdAt, currentMonthStart))
      .groupBy(
        dbSchema.usages.teamId,
        sql`date_trunc('month', ${dbSchema.usages.createdAt})`
      ),
    db
      .select({
        teamId: dbSchema.usages.teamId,
        monthStart: sql<string>`date_trunc('month', ${dbSchema.usages.createdAt})`,
        modelName: dbSchema.usages.modelName,
        requests: count(),
        totalCost: sql<string>`coalesce(sum(${dbSchema.usages.cost}), 0)`,
        tokensPrompt: sql<number>`coalesce(sum(${dbSchema.usages.tokensPrompt}), 0)`,
        tokensCompletion: sql<number>`coalesce(sum(${dbSchema.usages.tokensCompletion}), 0)`,
      })
      .from(dbSchema.usages)
      .where(lt(dbSchema.usages.createdAt, currentMonthStart))
      .groupBy(
        dbSchema.usages.teamId,
        sql`date_trunc('month', ${dbSchema.usages.createdAt})`,
        dbSchema.usages.modelName
      ),
  ])
  if (summaryRows.length === 0) {
    await db
      .delete(dbSchema.usages)
      .where(lt(dbSchema.usages.createdAt, currentMonthStart))
    return {
      archivedMonths: 0,
      cleanedBefore: currentMonthStart,
    }
  }
  const modelBreakdownMap = new Map<string, MonthlyUsageModelBreakdown[]>()
  for (const row of modelRows) {
    const monthStart = toDate(row.monthStart)
    const key = toMonthKey(row.teamId, monthStart)
    const current = modelBreakdownMap.get(key) || []
    current.push({
      modelName: row.modelName || 'unknown',
      requests: Number(row.requests || 0),
      totalCost: Number(row.totalCost || 0),
      tokensPrompt: Number(row.tokensPrompt || 0),
      tokensCompletion: Number(row.tokensCompletion || 0),
    })
    modelBreakdownMap.set(key, current)
  }
  const archiveRows = summaryRows.map((row) => {
    const monthStart = toDate(row.monthStart)
    const key = toMonthKey(row.teamId, monthStart)
    const modelBreakdown = (modelBreakdownMap.get(key) || []).sort(
      (left, right) => right.requests - left.requests
    )
    return {
      teamId: row.teamId,
      monthStart,
      monthEnd: endOfMonth(monthStart),
      totalRequests: Number(row.totalRequests || 0),
      totalCost: Number(row.totalCost || 0).toFixed(10),
      tokensPrompt: Number(row.tokensPrompt || 0),
      tokensCompletion: Number(row.tokensCompletion || 0),
      modelBreakdown,
      updatedAt: new Date(),
    }
  })
  await db.transaction(async (tx) => {
    for (const row of archiveRows) {
      await tx
        .insert(dbSchema.teamMonthlyUsages)
        .values(row)
        .onConflictDoUpdate({
          target: [
            dbSchema.teamMonthlyUsages.teamId,
            dbSchema.teamMonthlyUsages.monthStart,
          ],
          set: {
            monthEnd: row.monthEnd,
            totalRequests: row.totalRequests,
            totalCost: row.totalCost,
            tokensPrompt: row.tokensPrompt,
            tokensCompletion: row.tokensCompletion,
            modelBreakdown: row.modelBreakdown,
            updatedAt: row.updatedAt,
          },
        })
    }
    await tx
      .delete(dbSchema.usages)
      .where(lt(dbSchema.usages.createdAt, currentMonthStart))
  })
  return {
    archivedMonths: archiveRows.length,
    cleanedBefore: currentMonthStart,
  }
}
