import { t } from 'elysia'

export const CreateAIProviderSchema = t.Object({
  name: t.String(),
  apiKey: t.String(),
  baseUrl: t.String(),
  icon: t.Optional(t.String()),
})

export const UpdateAIProviderSchema = t.Object({
  id: t.String(),
  name: t.String(),
  baseUrl: t.String(),
  icon: t.Optional(t.String()),
})

export const UpdateAIProviderAPIKeySchema = t.Object({
  id: t.String(),
  apiKey: t.String(),
})
