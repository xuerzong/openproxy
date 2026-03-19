import { t } from 'elysia'

export const CreateAIProviderSchema = t.Object({
  name: t.String(),
  apiKeys: t.Optional(t.Array(t.String())),
  baseUrl: t.String(),
  icon: t.Optional(t.String()),
})

export const UpdateAIProviderSchema = t.Object({
  id: t.String(),
  name: t.String(),
  baseUrl: t.String(),
  icon: t.Optional(t.String()),
})

export const CreateAIProviderAPIKeySchema = t.Object({
  aiProviderId: t.String(),
  apiKey: t.String(),
})

export const AIProviderAPIKeyIdParamSchema = t.Object({
  id: t.String(),
})
