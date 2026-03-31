import { t } from 'elysia'
import { ACCESS_TOKEN_SCOPES } from '@server/services/access-token'

export const CreateAccessTokenBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 64 }),
  scopes: t.Array(t.Union(ACCESS_TOKEN_SCOPES.map((s) => t.Literal(s))), {
    minItems: 1,
  }),
  expiresAt: t.Nullable(t.Date()),
})

export const AccessTokenIdParamSchema = t.Object({
  id: t.String(),
})
