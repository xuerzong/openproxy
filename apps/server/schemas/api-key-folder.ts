import { t } from 'elysia'

export const CreateApiKeyFolderBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 32 }),
  isDefault: t.Optional(t.Boolean()),
})

export const UpdateApiKeyFolderBodySchema = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1, maxLength: 32 }),
  isDefault: t.Optional(t.Boolean()),
})
