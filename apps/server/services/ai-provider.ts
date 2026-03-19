import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { eq } from 'drizzle-orm'
import omit from 'lodash/omit'

const normalizeAPIKeys = (apiKeys: string[]) => {
  return Array.from(
    new Set(apiKeys.map((apiKey) => apiKey.trim()).filter(Boolean))
  )
}

const encryptAIProviderAPIKey = async (apiKey: string) => {
  const { generateDeApiKey } = await import('@server/lib/generate')
  const { rsaEncrypt } = await import('@server/lib/utils/rsa')

  return {
    apiKey: generateDeApiKey(apiKey),
    apiKeyHash: rsaEncrypt(apiKey),
  }
}

const syncLegacyAIProviderAPIKey = async (tx: any, aiProviderId: string) => {
  const firstAPIKey = await tx.query.aiProviderAPIKeys.findFirst({
    where: eq(dbSchema.aiProviderAPIKeys.aiProviderId, aiProviderId),
    columns: {
      apiKey: true,
      apiKeyHash: true,
    },
  })

  if (!firstAPIKey) {
    throw new Error('AI provider must keep at least one API key')
  }

  await tx
    .update(dbSchema.aiProviders)
    .set({
      apiKey: firstAPIKey.apiKey,
      apiKeyHash: firstAPIKey.apiKeyHash,
    })
    .where(eq(dbSchema.aiProviders.id, aiProviderId))
}

export const getAIProviders = async () => {
  const aiProviders = await db.query.aiProviders.findMany({
    with: {
      aiProviderAPIKeys: {
        columns: {
          id: true,
          apiKey: true,
          createdAt: true,
        },
      },
    },
  })

  return aiProviders.map(({ aiProviderAPIKeys, ...provider }) => ({
    ...omit(provider, 'apiKeyHash'),
    apiKeys: aiProviderAPIKeys,
    apiKeyCount: aiProviderAPIKeys.length,
  }))
}

export const createAIProvider = async (input: {
  name: string
  apiKeys: string[]
  baseUrl: string
  icon?: string
}) => {
  const apiKeys = normalizeAPIKeys(input.apiKeys)

  if (apiKeys.length === 0) {
    throw new Error('At least one API key is required')
  }

  await db.transaction(async (tx) => {
    const [legacyAPIKey, ...restAPIKeys] = apiKeys
    const encryptedLegacyAPIKey = await encryptAIProviderAPIKey(legacyAPIKey!)

    const aiProviders = await tx
      .insert(dbSchema.aiProviders)
      .values({
        name: input.name,
        apiKey: encryptedLegacyAPIKey.apiKey,
        apiKeyHash: encryptedLegacyAPIKey.apiKeyHash,
        baseUrl: input.baseUrl,
        icon: input.icon ?? '',
      })
      .returning({ id: dbSchema.aiProviders.id })

    const aiProvider = aiProviders[0]

    if (!aiProvider) {
      throw new Error('Failed to create AI provider')
    }

    const allAPIKeys = [legacyAPIKey, ...restAPIKeys]

    await tx.insert(dbSchema.aiProviderAPIKeys).values(
      await Promise.all(
        allAPIKeys.map(async (apiKey) => ({
          aiProviderId: aiProvider.id,
          ...(await encryptAIProviderAPIKey(apiKey!)),
        }))
      )
    )
  })
}

export const updateAIProvider = async (input: {
  id: string
  name: string
  baseUrl: string
  icon?: string
}) => {
  await db
    .update(dbSchema.aiProviders)
    .set({
      name: input.name,
      baseUrl: input.baseUrl,
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
    })
    .where(eq(dbSchema.aiProviders.id, input.id))
}

export const createAIProviderAPIKey = async (
  aiProviderId: string,
  apiKey: string
) => {
  const normalizedAPIKey = apiKey.trim()

  if (!normalizedAPIKey) {
    throw new Error('API key is required')
  }

  await db.transaction(async (tx) => {
    await tx.insert(dbSchema.aiProviderAPIKeys).values({
      aiProviderId,
      ...(await encryptAIProviderAPIKey(normalizedAPIKey)),
    })

    await syncLegacyAIProviderAPIKey(tx, aiProviderId)
  })
}

export const deleteAIProviderAPIKey = async (id: string) => {
  await db.transaction(async (tx) => {
    const aiProviderAPIKey = await tx.query.aiProviderAPIKeys.findFirst({
      where: eq(dbSchema.aiProviderAPIKeys.id, id),
      columns: {
        id: true,
        aiProviderId: true,
      },
    })

    if (!aiProviderAPIKey) {
      return
    }

    const aiProviderAPIKeys = await tx.query.aiProviderAPIKeys.findMany({
      where: eq(
        dbSchema.aiProviderAPIKeys.aiProviderId,
        aiProviderAPIKey.aiProviderId
      ),
      columns: {
        id: true,
      },
    })

    if (aiProviderAPIKeys.length <= 1) {
      throw new Error('AI provider must keep at least one API key')
    }

    await tx
      .delete(dbSchema.aiProviderAPIKeys)
      .where(eq(dbSchema.aiProviderAPIKeys.id, id))

    await syncLegacyAIProviderAPIKey(tx, aiProviderAPIKey.aiProviderId)
  })
}

export const deleteAIProvider = async (id: string) => {
  await db
    .delete(dbSchema.aiProviders)
    .where(eq(dbSchema.aiProviders.id, id))
    .returning()
}
