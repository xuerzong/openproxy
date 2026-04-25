import { Elysia } from 'elysia'
import { AI_PROVIDERS } from '@server/constants/ai-providers'

/**
 * Public registry of supported AI providers. The list is hardcoded and mirrors
 * `apps/api/src/models/ai_provider.rs`. Administrators pick from this list
 * rather than defining providers free-form.
 */
export const providersRouter = new Elysia().get('providers', async () => {
  return AI_PROVIDERS
})
