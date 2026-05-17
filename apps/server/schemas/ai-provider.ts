import { t } from 'elysia'

export const ProviderBaseUrlEntrySchema = t.Object({
  style: t.String(),
  baseUrl: t.String(),
})

export const CreateAIProviderSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String(),
  baseUrl: t.String(),
  baseUrls: t.Optional(t.Array(ProviderBaseUrlEntrySchema)),
  supportedStyles: t.Optional(t.Array(t.String())),
  docsUrl: t.Optional(t.String()),
  icon: t.Optional(t.String()),
})

export const UpdateAIProviderSchema = t.Object({
  id: t.String(),
  name: t.String(),
  baseUrl: t.String(),
  baseUrls: t.Optional(t.Array(ProviderBaseUrlEntrySchema)),
  supportedStyles: t.Optional(t.Array(t.String())),
  docsUrl: t.Optional(t.String()),
  icon: t.Optional(t.String()),
})

export const CreateAIProviderAPIKeySchema = t.Object({
  aiProviderId: t.String(),
  apiKey: t.String(),
  remark: t.Optional(t.String()),
})

export const AIProviderAPIKeyIdParamSchema = t.Object({
  id: t.String(),
})
