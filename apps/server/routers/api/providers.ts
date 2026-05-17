import { Elysia } from 'elysia'
import { db } from '@server/lib/db/client'

/**
 * Public registry of supported AI providers.
 */
export const providersRouter = new Elysia().get('providers', async () => {
  const providers = await db.query.aiProviders.findMany({
    columns: {
      id: true,
      name: true,
      baseUrl: true,
      baseUrls: true,
      supportedStyles: true,
      docsUrl: true,
    },
  })

  return providers
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      baseUrls: provider.baseUrls ?? [],
      supportedStyles: provider.supportedStyles ?? [],
      docsUrl: provider.docsUrl ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
})
