import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { AI_PROVIDERS } from '@server/constants/ai-providers'
import type { AIProvider as RegistryAIProvider } from '@openproxy/config/ai-providers'
import { eq } from 'drizzle-orm'

type TransactionClient = Parameters<typeof db.transaction>[0] extends (
  arg: infer T
) => unknown
  ? T
  : never

type AIProviderRow = Awaited<
  ReturnType<typeof db.query.aiProviders.findMany>
>[number]

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

const matchesRegistryProvider = (
  row: Pick<AIProviderRow, 'id' | 'name' | 'baseUrl'>,
  provider: RegistryAIProvider
) => {
  return (
    row.id === provider.id ||
    row.name === provider.name ||
    row.baseUrl === provider.baseUrl
  )
}

const findRegistryProvider = (input: {
  id?: string
  name?: string
  baseUrl?: string
}) => {
  return AI_PROVIDERS.find((provider) => {
    return (
      (input.id && provider.id === input.id) ||
      (input.name && provider.name === input.name) ||
      (input.baseUrl && provider.baseUrl === input.baseUrl)
    )
  })
}

const listAIProviderRows = async (tx: TransactionClient) => {
  return tx.query.aiProviders.findMany({
    columns: {
      id: true,
      name: true,
      baseUrl: true,
      icon: true,
    },
  })
}

const ensureRegistryAIProviderRow = async (
  tx: TransactionClient,
  provider: RegistryAIProvider
) => {
  const existingRows = await listAIProviderRows(tx)
  const existingRow = existingRows.find((row) =>
    matchesRegistryProvider(row, provider)
  )

  if (existingRow) {
    if (
      existingRow.name !== provider.name ||
      existingRow.baseUrl !== provider.baseUrl ||
      existingRow.icon !== provider.id
    ) {
      await tx
        .update(dbSchema.aiProviders)
        .set({
          name: provider.name,
          baseUrl: provider.baseUrl,
          icon: provider.id,
        })
        .where(eq(dbSchema.aiProviders.id, existingRow.id))
    }

    return existingRow.id
  }

  const placeholderAPIKey = await encryptAIProviderAPIKey('')
  const insertedRows = await tx
    .insert(dbSchema.aiProviders)
    .values({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      icon: provider.id,
      apiKey: placeholderAPIKey.apiKey,
      apiKeyHash: placeholderAPIKey.apiKeyHash,
    })
    .returning({ id: dbSchema.aiProviders.id })

  const insertedRow = insertedRows[0]

  if (!insertedRow) {
    throw new Error('Failed to initialize built-in AI provider row')
  }

  return insertedRow.id
}

const ensureRegistryAIProviders = async () => {
  await db.transaction(async (tx) => {
    for (const provider of AI_PROVIDERS) {
      await ensureRegistryAIProviderRow(tx, provider)
    }
  })
}

const syncLegacyAIProviderAPIKey = async (
  tx: TransactionClient,
  aiProviderId: string
) => {
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
  await ensureRegistryAIProviders()

  const aiProviders = await db.query.aiProviders.findMany({
    with: {
      aiProviderAPIKeys: {
        columns: {
          id: true,
          apiKey: true,
          remark: true,
          createdAt: true,
        },
      },
    },
  })

  return AI_PROVIDERS.map((provider) => {
    const dbProvider = aiProviders.find((row) =>
      matchesRegistryProvider(row, provider)
    )
    const apiKeys = dbProvider?.aiProviderAPIKeys ?? []

    return {
      ...provider,
      id: provider.id,
      apiKeys,
      apiKeyCount: apiKeys.length,
    }
  })
}

export const createAIProvider = async (input: {
  name: string
  apiKeys?: string[]
  baseUrl: string
  icon?: string
}) => {
  void input
  throw new Error(
    'Built-in AI providers are fixed; only API key management is supported'
  )
}

export const updateAIProvider = async (input: {
  id: string
  name: string
  baseUrl: string
  icon?: string
}) => {
  void input
  throw new Error(
    'Built-in AI providers are fixed; only API key management is supported'
  )
}

export const createAIProviderAPIKey = async (
  aiProviderId: string,
  apiKey: string,
  remark?: string
) => {
  const normalizedAPIKey = apiKey.trim()
  const normalizedRemark = remark?.trim() ?? ''

  if (!normalizedAPIKey) {
    throw new Error('API key is required')
  }

  const provider = findRegistryProvider({ id: aiProviderId })

  if (!provider) {
    throw new Error('AI provider must come from the built-in provider registry')
  }

  await db.transaction(async (tx) => {
    const resolvedAIProviderId = await ensureRegistryAIProviderRow(tx, provider)

    await tx.insert(dbSchema.aiProviderAPIKeys).values({
      aiProviderId: resolvedAIProviderId,
      remark: normalizedRemark,
      ...(await encryptAIProviderAPIKey(normalizedAPIKey)),
    })

    await syncLegacyAIProviderAPIKey(tx, resolvedAIProviderId)
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
  const provider = findRegistryProvider({ id })

  if (!provider) {
    throw new Error('AI provider must come from the built-in provider registry')
  }

  throw new Error('Built-in AI providers cannot be deleted')
}
