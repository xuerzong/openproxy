import { t } from 'elysia'

// API Key create request body
export const CreateApiKeyBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 32 }),
  folderId: t.Optional(t.Nullable(t.String())),
  expiresAt: t.Nullable(t.Date()),
  maxQuota: t.Optional(t.Numeric({ minimum: 0 })),
  maxRequests: t.Optional(t.Number({ minimum: 0 })),
  modelIds: t.Array(t.String()),
})

// API Key update request body
export const UpdateApiKeyBodySchema = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1, maxLength: 32 }),
  folderId: t.Optional(t.Nullable(t.String())),
  expiresAt: t.Nullable(t.Date()),
  maxQuota: t.Optional(t.Numeric({ minimum: 0 })),
  maxRequests: t.Optional(t.Number({ minimum: 0 })),
  modelIds: t.Array(t.String()),
})

// API Key ID parameter
export const ApiKeyIdParamSchema = t.Object({
  id: t.String(),
})
