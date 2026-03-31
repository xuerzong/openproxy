import { and, eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { getModels } from '@server/lib/db/models'
import { generateModelSuffix } from '@server/lib/generate'
import Decimal from 'decimal.js'

type ModelInsert = typeof dbSchema.models.$inferInsert
type ModelPricing = ModelInsert['pricing']

export const getModelsWithPermission = async (userId?: string) => {
  const models = await getModels()
  return models
}

export const createModel = async (params: {
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
  pricing: {
    input: number
    output: number
    input_cache_read: number
    output_tiers?: {
      cost: number
      min?: number
      max?: number
    }[]
    input_cache_read_tiers?: {
      cost: number
      min?: number
      max?: number
    }[]
  }
  tags?: string[]
  metadata?: unknown
}) => {
  const {
    id,
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
  const pricingValue: ModelPricing = {
    input: new Decimal(pricing.input).toString(),
    output: new Decimal(pricing.output).toString(),
    input_cache_read: new Decimal(pricing.input_cache_read).toString(),
  }
  if (pricing.output_tiers) {
    pricingValue.output_tiers = pricing.output_tiers.map((tier) => ({
      cost: new Decimal(tier.cost).toString(),
      ...(tier.min != null ? { min: tier.min } : {}),
      ...(tier.max != null ? { max: tier.max } : {}),
    }))
  }
  if (pricing.input_cache_read_tiers) {
    pricingValue.input_cache_read_tiers = pricing.input_cache_read_tiers.map(
      (tier) => ({
        cost: new Decimal(tier.cost).toString(),
        ...(tier.min != null ? { min: tier.min } : {}),
        ...(tier.max != null ? { max: tier.max } : {}),
      })
    )
  }
  const values: Omit<ModelInsert, 'id' | 'createdAt' | 'updatedAt'> = {
    isPublic: isAdmin ? isPublicParam || false : false,
    name,
    description: description || '',
    model,
    ownedBy: ownedBy || 'other',
    contextWindow: contextWindow || 0,
    maxTokens: maxTokens || 0,
    type,
    styles,
    pricing: pricingValue,
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

export const updateModel = async (params: {
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
  pricing: {
    input: number
    output: number
    input_cache_read: number
    output_tiers?: {
      cost: number
      min?: number
      max?: number
    }[]
    input_cache_read_tiers?: {
      cost: number
      min?: number
      max?: number
    }[]
  }
  tags?: string[]
  metadata?: unknown
}) => {
  const {
    id,
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
  const pricingValue: ModelPricing = {
    input: new Decimal(pricing.input).toString(),
    output: new Decimal(pricing.output).toString(),
    input_cache_read: new Decimal(pricing.input_cache_read).toString(),
  }
  if (pricing.output_tiers) {
    pricingValue.output_tiers = pricing.output_tiers.map((tier) => ({
      cost: new Decimal(tier.cost).toString(),
      ...(tier.min != null ? { min: tier.min } : {}),
      ...(tier.max != null ? { max: tier.max } : {}),
    }))
  }
  if (pricing.input_cache_read_tiers) {
    pricingValue.input_cache_read_tiers = pricing.input_cache_read_tiers.map(
      (tier) => ({
        cost: new Decimal(tier.cost).toString(),
        ...(tier.min != null ? { min: tier.min } : {}),
        ...(tier.max != null ? { max: tier.max } : {}),
      })
    )
  }
  const values: Omit<ModelInsert, 'id' | 'createdAt' | 'updatedAt'> = {
    isPublic: isAdmin ? isPublicParam || false : false,
    name,
    description: description || '',
    model,
    ownedBy: ownedBy || 'other',
    contextWindow: contextWindow || 0,
    maxTokens: maxTokens || 0,
    type,
    styles,
    pricing: pricingValue,
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

export const deleteModel = async (id: string) => {
  await db
    .delete(dbSchema.models)
    .where(and(eq(dbSchema.models.id, id)))
    .returning()
  return id
}

export const getModelById = async (id: string) => {
  const model = await db.query.models.findFirst({
    where: eq(dbSchema.models.id, id),
    with: {
      modelsToAIProviders: {
        columns: {
          id: true,
          model: true,
          weight: true,
          status: true,
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

export const insertModelProvider = async (
  modelId: string,
  aiProviderId: string,
  provider: {
    model: string
    weight: number
    status?: number
  }
) => {
  await db.insert(dbSchema.modelsToAIProviders).values({
    modelId: modelId,
    aiProviderId,
    status: provider.status ?? 1,
    model: provider.model,
    weight: provider.weight,
  })
}

export const updateModelProvider = async (
  aiProviderId: string,
  provider: {
    id: string
    model: string
    weight: number
    status?: number
  }
) => {
  await db
    .update(dbSchema.modelsToAIProviders)
    .set({
      aiProviderId,
      status: provider.status ?? 1,
      model: provider.model,
      weight: provider.weight,
    })
    .where(eq(dbSchema.modelsToAIProviders.id, provider.id))
}

export const delModelProvider = async (provider: { id: string }) => {
  await db
    .delete(dbSchema.modelsToAIProviders)
    .where(eq(dbSchema.modelsToAIProviders.id, provider.id))
    .returning()
}
