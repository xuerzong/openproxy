import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { generateApiKey, generateDeApiKey } from '@server/lib/generate'
import { hash } from '@server/lib/utils/hash'
import Decimal from 'decimal.js'

export const getApiKeysByTeamId = async (teamId: string) => {
  const apiKeys = await db.query.apiKeys.findMany({
    where: and(eq(dbSchema.apiKeys.teamId, teamId)),
    orderBy: desc(dbSchema.apiKeys.createdAt),
    with: {
      apiKeysToModels: {
        columns: {
          modelId: true,
        },
      },
    },
  })
  return apiKeys.map((apiKey) => ({
    ...apiKey,
    modelIds: apiKey.apiKeysToModels.map((model) => model.modelId),
    maxQuota: new Decimal(apiKey.maxQuota).toFixed(2),
  }))
}

export const createApiKey = async (params: {
  teamId: string
  teamUserId: string
  name: string
  expiresAt: Date | null
  maxQuota?: number
  maxRequests?: number
  modelIds: string[]
}) => {
  const {
    teamId,
    teamUserId,
    name,
    expiresAt,
    maxQuota,
    maxRequests,
    modelIds,
  } = params
  const apiKey = generateApiKey()
  await db.transaction(async (tx) => {
    const apiKeys = await tx
      .insert(dbSchema.apiKeys)
      .values({
        name,
        apiKey: generateDeApiKey(apiKey),
        apiKeyHash: await hash(apiKey),
        teamId,
        userId: teamUserId,
        expiresAt,
        maxQuota: maxQuota?.toString(),
        maxRequests,
      })
      .returning({ id: dbSchema.apiKeys.id })
    const newApiKey = apiKeys[0]!
    if (modelIds.length > 0) {
      await tx
        .insert(dbSchema.apiKeysToModels)
        .values(
          modelIds.map((modelId) => ({
            apiKeyId: newApiKey.id,
            modelId,
          }))
        )
        .onConflictDoNothing()
    }
  })
  return apiKey
}

export const getApiKeyCountByTeamId = async (teamId: string) => {
  const [row] = await db
    .select({ value: count() })
    .from(dbSchema.apiKeys)
    .where(eq(dbSchema.apiKeys.teamId, teamId))

  return row?.value || 0
}

export const updateApiKey = async (params: {
  id: string
  teamId: string
  name: string
  expiresAt: Date | null
  maxQuota?: number
  maxRequests?: number
  modelIds: string[]
}) => {
  const { id, teamId, name, expiresAt, maxQuota, maxRequests, modelIds } =
    params
  const apiKeys = await db
    .select()
    .from(dbSchema.apiKeys)
    .where(eq(dbSchema.apiKeys.teamId, teamId))
  if (apiKeys.length === 0) {
    throw new Error('权限不足')
  }
  await db.transaction(async (tx) => {
    await tx
      .update(dbSchema.apiKeys)
      .set({
        name,
        expiresAt,
        maxQuota: maxQuota?.toString(),
        maxRequests,
      })
      .where(eq(dbSchema.apiKeys.id, id))
    const currentModels = await tx
      .select({
        modelId: dbSchema.apiKeysToModels.modelId,
      })
      .from(dbSchema.apiKeysToModels)
      .where(eq(dbSchema.apiKeysToModels.apiKeyId, id))
    const currentModelIds = currentModels.map((m) => m.modelId)
    const shouldDelModelIds: string[] = []
    const shouldAddModelIds: string[] = []
    const modelIdActionsMap = new Map<string, 'del' | 'add' | 'none'>()
    for (const modelId of currentModelIds) {
      modelIdActionsMap.set(modelId, 'del')
    }
    for (const modelId of modelIds) {
      if (modelIdActionsMap.has(modelId)) {
        modelIdActionsMap.delete(modelId)
      } else {
        modelIdActionsMap.set(modelId, 'add')
      }
    }
    for (const [modelId, action] of modelIdActionsMap.entries()) {
      switch (action) {
        case 'add':
          shouldAddModelIds.push(modelId)
          break
        case 'del':
          shouldDelModelIds.push(modelId)
          break
      }
    }
    if (shouldAddModelIds.length) {
      await tx.insert(dbSchema.apiKeysToModels).values(
        shouldAddModelIds.map((modelId) => ({
          modelId,
          apiKeyId: id,
        }))
      )
    }
    if (shouldDelModelIds.length) {
      await tx
        .delete(dbSchema.apiKeysToModels)
        .where(inArray(dbSchema.apiKeysToModels.modelId, shouldDelModelIds))
    }
  })
}

export const deleteApiKey = async (id: string, teamId: string) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(dbSchema.apiKeys)
      .where(
        and(eq(dbSchema.apiKeys.id, id), eq(dbSchema.apiKeys.teamId, teamId))
      )
      .returning()
  })
}
