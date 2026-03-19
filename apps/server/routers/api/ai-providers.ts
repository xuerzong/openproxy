import Elysia from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  createAIProviderAPIKey,
  createAIProvider,
  deleteAIProvider,
  deleteAIProviderAPIKey,
  getAIProviders,
  updateAIProvider,
} from '@server/services/ai-provider'
import {
  AIProviderAPIKeyIdParamSchema,
  CreateAIProviderAPIKeySchema,
  CreateAIProviderSchema,
  UpdateAIProviderSchema,
} from '@server/schemas/ai-provider'

export const aiProvidersRouter = new Elysia()
  .use(betterAuthPlugin)
  .get(
    'aiProviders',
    async () => {
      return getAIProviders()
    },
    { auth: { role: 'admin' } }
  )
  .post(
    'aiProviders',
    async ({ body }) => {
      await createAIProvider(body)
    },
    { auth: { role: 'admin' }, body: CreateAIProviderSchema }
  )
  .put(
    'aiProviders',
    async ({ body }) => {
      await updateAIProvider(body)
    },
    { auth: { role: 'admin' }, body: UpdateAIProviderSchema }
  )
  .post(
    'aiProviders/apiKeys',
    async ({ body }) => {
      await createAIProviderAPIKey(body.aiProviderId, body.apiKey)
    },
    { auth: { role: 'admin' }, body: CreateAIProviderAPIKeySchema }
  )
  .delete(
    'aiProviders/apiKeys/:id',
    async ({ params }) => {
      await deleteAIProviderAPIKey(params.id)
    },
    { auth: { role: 'admin' }, params: AIProviderAPIKeyIdParamSchema }
  )
  .delete(
    'aiProviders/:id',
    async ({ params }) => {
      await deleteAIProvider(params.id)
    },
    { auth: { role: 'admin' } }
  )
