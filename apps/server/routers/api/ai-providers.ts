import Elysia from 'elysia'
import { betterAuthPlugin } from '../better-auth'
import {
  createAIProvider,
  delAIProviderAPIKey,
  getAIProviders,
  updateAIProvider,
  updateAIProviderAPIKey,
} from '@server/services/ai-provider'
import {
  CreateAIProviderSchema,
  UpdateAIProviderAPIKeySchema,
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
  .put(
    'aiProviders/updateAPIKey',
    async ({ body }) => {
      await updateAIProviderAPIKey(body.id, body.apiKey)
    },
    { auth: { role: 'admin' }, body: UpdateAIProviderAPIKeySchema }
  )
  .delete(
    'aiProviders/:id',
    async ({ params }) => {
      await delAIProviderAPIKey(params.id)
    },
    { auth: { role: 'admin' } }
  )
