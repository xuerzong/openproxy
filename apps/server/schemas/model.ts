import { t } from 'elysia'

// Model type enum
export const ModelTypeSchema = t.Union([
  t.Literal('language'),
  t.Literal('image'),
  t.Literal('embedding'),
])

// Pricing structure
export const PricingSchema = t.Object({
  input: t.Numeric({ minimum: 0, maximum: 99999 }),
  output: t.Numeric({ minimum: 0, maximum: 99999 }),
  input_cache_read: t.Numeric({ minimum: 0, maximum: 99999 }),
})

// Create model request body
export const CreateModelBodySchema = t.Object({
  id: t.String({ maxLength: 64 }),
  name: t.String({ maxLength: 64 }),
  description: t.Optional(t.String({ maxLength: 1024 })),
  model: t.String({ maxLength: 64 }),
  ownedBy: t.String({ maxLength: 64 }),
  isPublic: t.Optional(t.Boolean()),
  type: ModelTypeSchema,
  contextWindow: t.Optional(t.Number({ minimum: 0, maximum: 99999999 })),
  maxTokens: t.Optional(t.Number({ minimum: 0, maximum: 99999999 })),
  styles: t.Array(t.String({ maxLength: 32 })),
  pricing: PricingSchema,
  tags: t.Array(t.String({ maxLength: 32 })),
  metadata: t.Any(),
})

// Update model request body
export const UpdateModelBodySchema = t.Object({
  id: t.String({ maxLength: 128 }),
  name: t.String({ maxLength: 64 }),
  description: t.Optional(t.String({ maxLength: 1024 })),
  model: t.String({ maxLength: 64 }),
  ownedBy: t.String({ maxLength: 64 }),
  isPublic: t.Optional(t.Boolean()),
  type: ModelTypeSchema,
  contextWindow: t.Optional(t.Number({ minimum: 0, maximum: 99999999 })),
  maxTokens: t.Optional(t.Number({ minimum: 0, maximum: 99999999 })),
  styles: t.Array(t.String({ maxLength: 32 })),
  pricing: PricingSchema,
  tags: t.Array(t.String({ maxLength: 32 })),
  metadata: t.Any(),
})

export const DelModelBodySchema = t.Object({
  id: t.String({ maxLength: 128 }),
})

export const GetModelDetailQuerySchema = t.Object({
  id: t.String({ maxLength: 128 }),
})

// Model ID parameter
export const ModelIdParamSchema = t.Object({
  id: t.String(),
})

export const InsertModelProviderSchema = t.Object({
  modelId: t.String(),
  aiProviderId: t.String(),
  provider: t.Object({
    model: t.String(),
    weight: t.Number(),
    status: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
  }),
})

export const UpdateModelProviderSchema = t.Object({
  aiProviderId: t.String(),
  provider: t.Object({
    id: t.String(),
    model: t.String(),
    weight: t.Number(),
    status: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
  }),
})

export const DelModelProviderSchema = t.Object({
  provider: t.Object({
    id: t.String(),
  }),
})
