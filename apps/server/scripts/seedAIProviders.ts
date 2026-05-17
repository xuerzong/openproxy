import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import type { AIProvider } from '@openproxy/config/ai-providers'
import { eq } from 'drizzle-orm'

const providerRegistryCandidates = [
  resolve(process.cwd(), 'packages/config/src/ai-providers.json'),
  resolve(process.cwd(), '../../packages/config/src/ai-providers.json'),
  new URL('../../../packages/config/src/ai-providers.json', import.meta.url)
    .pathname,
]

const providerRegistryFile = providerRegistryCandidates.find((candidate) =>
  existsSync(candidate)
)

if (!providerRegistryFile) {
  throw new Error(
    'Cannot find packages/config/src/ai-providers.json for seeding'
  )
}

const providers = JSON.parse(
  readFileSync(providerRegistryFile, 'utf8')
) as AIProvider[]

const encryptAIProviderAPIKey = async (apiKey: string) => {
  const { generateDeApiKey } = await import('@server/lib/generate')
  const { rsaEncrypt } = await import('@server/lib/utils/rsa')

  return {
    apiKey: generateDeApiKey(apiKey),
    apiKeyHash: rsaEncrypt(apiKey),
  }
}

const seed = async () => {
  await db.transaction(async (tx) => {
    const placeholderAPIKey = await encryptAIProviderAPIKey('')

    for (const provider of providers) {
      const existing = await tx.query.aiProviders.findFirst({
        where: eq(dbSchema.aiProviders.id, provider.id),
        columns: { id: true, isBuiltIn: true },
      })

      const sharedValues = {
        name: provider.name,
        baseUrl: provider.baseUrl,
        baseUrls: provider.baseUrls,
        supportedStyles: provider.supportedStyles,
        docsUrl: provider.docsUrl,
        icon: provider.id,
      }

      if (existing) {
        if (!existing.isBuiltIn) {
          throw new Error(
            `[seed] provider id "${provider.id}" already exists as a custom provider; refusing to overwrite. Rename or delete the custom row first.`
          )
        }
        await tx
          .update(dbSchema.aiProviders)
          .set(sharedValues)
          .where(eq(dbSchema.aiProviders.id, provider.id))
        continue
      }

      await tx.insert(dbSchema.aiProviders).values({
        id: provider.id,
        ...sharedValues,
        isBuiltIn: true,
        apiKey: placeholderAPIKey.apiKey,
        apiKeyHash: placeholderAPIKey.apiKeyHash,
      })
    }
  })

  console.log(`[server] seeded ${providers.length} AI providers`)
}

await seed()
