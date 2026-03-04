import { and, eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { getModels } from '@server/lib/db/models'
import { generateModelSuffix } from '@server/lib/generate'
import Decimal from 'decimal.js'

export async function getModelsWithPermission(userId?: string) {
  const models = await getModels({ userId })
  return models
}

export async function createModel(params: {
  id: string
  userId: string
  isAdmin: boolean
  name: string
  description?: string
  model: string
  ownedBy?: string
  isPublic?: boolean
  type: 'language' | 'image' | 'embedding'
  contextWindow?: number
  maxTokens?: number
  styles: string[]
  pricing: { input: number; output: number; input_cache_read: number }
  tags?: string[]
  metadata?: any
}) {
  const {
    id,
    userId,
    isAdmin,
    name,
    description,
    model,
    ownedBy,
    isPublic: isPublicParam,
    type,
    contextWindow,
    maxTokens,
    styles,
    pricing,
    tags,
    metadata,
  } = params

  const values = {
    userId,
    isPublic: isAdmin ? isPublicParam || false : false,
    name,
    description: description || '',
    model,
    ownedBy: ownedBy || 'other',
    contextWindow: contextWindow || 0,
    maxTokens: maxTokens || 0,
    type,
    styles,
    pricing: {
      input: new Decimal(pricing.input).toString(),
      output: new Decimal(pricing.output).toString(),
      input_cache_read: new Decimal(pricing.input_cache_read).toString(),
    },
    tags: tags || [],
    metadata: metadata || {},
  }

  const newId = values.isPublic ? id.trim() : id.trim() + generateModelSuffix()

  const models = await db
    .insert(dbSchema.models)
    .values({
      ...values,
      id: newId,
    })
    .returning({ id: dbSchema.models.id })
  return models
}

export async function updateModel(params: {
  id: string
  userId: string
  isAdmin: boolean
  name: string
  description?: string
  model: string
  ownedBy?: string
  isPublic?: boolean
  type: 'language' | 'image' | 'embedding'
  contextWindow?: number
  maxTokens?: number
  styles: string[]
  pricing: { input: number; output: number; input_cache_read: number }
  tags?: string[]
  metadata?: any
}) {
  const {
    id,
    userId,
    isAdmin,
    name,
    description,
    model,
    ownedBy,
    isPublic: isPublicParam,
    type,
    contextWindow,
    maxTokens,
    styles,
    pricing,
    tags,
    metadata,
  } = params

  const values = {
    userId,
    isPublic: isAdmin ? isPublicParam || false : false,
    name,
    description: description || '',
    model,
    ownedBy: ownedBy || 'other',
    contextWindow: contextWindow || 0,
    maxTokens: maxTokens || 0,
    type,
    styles,
    pricing: {
      input: new Decimal(pricing.input).toString(),
      output: new Decimal(pricing.output).toString(),
      input_cache_read: new Decimal(pricing.input_cache_read).toString(),
    },
    tags: tags || [],
    metadata: metadata || {},
  }

  await db
    .update(dbSchema.models)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.models.id, id))
    .returning()
}

export async function deleteModel(id: string) {
  await db
    .delete(dbSchema.models)
    .where(and(eq(dbSchema.models.id, id)))
    .returning()
  return id
}

export async function getModelById(id: string) {
  const model = await db.query.models.findFirst({
    where: eq(dbSchema.models.id, id),
    with: {
      modelsToAIProviders: {
        columns: {
          model: true,
          weight: true,
        },
        with: {
          provider: {
            columns: {
              apiKeyHash: false,
            },
          },
        },
      },
    },
  })
  if (!model) return model
  const { modelsToAIProviders, ...restModels } = model
  return {
    ...restModels,
    providers: modelsToAIProviders,
  }
}

export const upsertModelProviders = async (
  modelId: string,
  provider: {
    id: string
    model: string
    weight: number
  }
) => {
  await db
    .insert(dbSchema.modelsToAIProviders)
    .values({
      modelId: modelId,
      aiProviderId: provider.id,
      model: provider.model,
      weight: provider.weight,
    })
    .onConflictDoUpdate({
      target: [
        dbSchema.modelsToAIProviders.modelId,
        dbSchema.modelsToAIProviders.aiProviderId,
      ],
      set: {
        model: provider.model,
        weight: provider.weight,
      },
    })
}

export const delModelProvider = async (
  modelId: string,
  provider: {
    id: string
  }
) => {
  await db
    .delete(dbSchema.modelsToAIProviders)
    .where(
      and(
        eq(dbSchema.modelsToAIProviders.modelId, modelId),
        eq(dbSchema.modelsToAIProviders.aiProviderId, provider.id)
      )
    )
    .returning()
}
