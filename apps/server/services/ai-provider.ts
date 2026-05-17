import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import type {
  ProviderBaseUrl as RegistryProviderBaseUrl,
  ProviderStyle as RegistryProviderStyle,
} from '@openproxy/config/ai-providers'
import { AI_PROVIDERS } from '@server/constants/ai-providers'
import { eq } from 'drizzle-orm'
import { generateDBId } from '@server/lib/generate'

const BUILT_IN_PROVIDER_IDS: ReadonlySet<string> = new Set(
  AI_PROVIDERS.map((provider) => provider.id)
)

type TransactionClient = Parameters<typeof db.transaction>[0] extends (
  arg: infer T
) => unknown
  ? T
  : never

type ProviderBaseUrlInput = {
  style: string
  baseUrl: string
}

type CreateAIProviderInput = {
  id?: string
  name: string
  baseUrl: string
  baseUrls?: ProviderBaseUrlInput[]
  supportedStyles?: string[]
  docsUrl?: string
  icon?: string
}

type UpdateAIProviderInput = {
  id: string
  name: string
  baseUrl: string
  baseUrls?: ProviderBaseUrlInput[]
  supportedStyles?: string[]
  docsUrl?: string
  icon?: string
}

const encryptAIProviderAPIKey = async (apiKey: string) => {
  const { generateDeApiKey } = await import('@server/lib/generate')
  const { rsaEncrypt } = await import('@server/lib/utils/rsa')

  return {
    apiKey: generateDeApiKey(apiKey),
    apiKeyHash: rsaEncrypt(apiKey),
  }
}

const normalizeBaseUrls = (
  baseUrls?: ProviderBaseUrlInput[]
): ProviderBaseUrlInput[] => {
  if (!baseUrls) return []
  const seenStyles = new Set<string>()
  const result: ProviderBaseUrlInput[] = []
  for (const entry of baseUrls) {
    const style = entry.style.trim()
    const baseUrl = entry.baseUrl.trim()
    if (!style || !baseUrl) continue
    if (seenStyles.has(style)) continue
    seenStyles.add(style)
    result.push({ style, baseUrl })
  }
  return result
}

const normalizeSupportedStyles = (styles?: string[]): string[] => {
  if (!styles) return []
  return Array.from(
    new Set(styles.map((style) => style.trim()).filter(Boolean))
  )
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

  if (firstAPIKey) {
    await tx
      .update(dbSchema.aiProviders)
      .set({
        apiKey: firstAPIKey.apiKey,
        apiKeyHash: firstAPIKey.apiKeyHash,
      })
      .where(eq(dbSchema.aiProviders.id, aiProviderId))
    return
  }

  const placeholder = await encryptAIProviderAPIKey('')
  await tx
    .update(dbSchema.aiProviders)
    .set({
      apiKey: placeholder.apiKey,
      apiKeyHash: placeholder.apiKeyHash,
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
          remark: true,
          createdAt: true,
        },
      },
    },
  })

  return aiProviders
    .map((row) => {
      const apiKeys = row.aiProviderAPIKeys ?? []
      return {
        id: row.id,
        name: row.name,
        baseUrl: row.baseUrl,
        baseUrls: (row.baseUrls ?? []) as RegistryProviderBaseUrl[],
        supportedStyles: (row.supportedStyles ?? []) as RegistryProviderStyle[],
        docsUrl: row.docsUrl ?? '',
        icon: row.icon || row.id,
        isBuiltIn: row.isBuiltIn,
        apiKeys,
        apiKeyCount: apiKeys.length,
      }
    })
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) return a.isBuiltIn ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export const createAIProvider = async (input: CreateAIProviderInput) => {
  const name = input.name.trim()
  const baseUrl = input.baseUrl.trim()

  if (!name) throw new Error('Provider name is required')
  if (!baseUrl) throw new Error('Base URL is required')

  const id = input.id?.trim() || generateDBId()

  if (input.id && BUILT_IN_PROVIDER_IDS.has(id)) {
    throw new Error(
      `Provider id "${id}" is reserved by a built-in provider. Pick a different id.`
    )
  }

  const existing = await db.query.aiProviders.findFirst({
    where: eq(dbSchema.aiProviders.id, id),
    columns: { id: true },
  })
  if (existing) {
    throw new Error(`Provider id "${id}" already exists`)
  }

  const placeholder = await encryptAIProviderAPIKey('')

  await db.insert(dbSchema.aiProviders).values({
    id,
    name,
    baseUrl,
    baseUrls: normalizeBaseUrls(input.baseUrls) as RegistryProviderBaseUrl[],
    supportedStyles: normalizeSupportedStyles(
      input.supportedStyles
    ) as RegistryProviderStyle[],
    docsUrl: input.docsUrl?.trim() ?? '',
    icon: input.icon?.trim() || id,
    isBuiltIn: false,
    apiKey: placeholder.apiKey,
    apiKeyHash: placeholder.apiKeyHash,
  })
}

export const updateAIProvider = async (input: UpdateAIProviderInput) => {
  const existing = await db.query.aiProviders.findFirst({
    where: eq(dbSchema.aiProviders.id, input.id),
    columns: { id: true, isBuiltIn: true },
  })

  if (!existing) {
    throw new Error('AI provider not found')
  }

  if (existing.isBuiltIn) {
    throw new Error('Built-in AI providers cannot be edited')
  }

  const name = input.name.trim()
  const baseUrl = input.baseUrl.trim()

  if (!name) throw new Error('Provider name is required')
  if (!baseUrl) throw new Error('Base URL is required')

  await db
    .update(dbSchema.aiProviders)
    .set({
      name,
      baseUrl,
      baseUrls: normalizeBaseUrls(input.baseUrls) as RegistryProviderBaseUrl[],
      supportedStyles: normalizeSupportedStyles(
        input.supportedStyles
      ) as RegistryProviderStyle[],
      docsUrl: input.docsUrl?.trim() ?? '',
      icon: input.icon?.trim() || existing.id,
    })
    .where(eq(dbSchema.aiProviders.id, input.id))
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

  await db.transaction(async (tx) => {
    const dbProvider = await tx.query.aiProviders.findFirst({
      where: eq(dbSchema.aiProviders.id, aiProviderId),
      columns: { id: true },
    })
    if (!dbProvider) {
      throw new Error('AI provider not found')
    }

    await tx.insert(dbSchema.aiProviderAPIKeys).values({
      aiProviderId,
      remark: normalizedRemark,
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

    await tx
      .delete(dbSchema.aiProviderAPIKeys)
      .where(eq(dbSchema.aiProviderAPIKeys.id, id))

    await syncLegacyAIProviderAPIKey(tx, aiProviderAPIKey.aiProviderId)
  })
}

export const deleteAIProvider = async (id: string) => {
  const existing = await db.query.aiProviders.findFirst({
    where: eq(dbSchema.aiProviders.id, id),
    columns: { id: true, isBuiltIn: true },
  })

  if (!existing) {
    return
  }

  if (existing.isBuiltIn) {
    throw new Error('Built-in AI providers cannot be deleted')
  }

  await db.delete(dbSchema.aiProviders).where(eq(dbSchema.aiProviders.id, id))
}
