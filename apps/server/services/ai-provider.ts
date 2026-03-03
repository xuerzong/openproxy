import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { eq } from 'drizzle-orm'
import omit from 'lodash/omit'

export const getAIProviders = async () => {
  const aiProviders = await db.query.aiProviders.findMany()
  return aiProviders.map((d) => omit(d, 'apiKeyHash'))
}

export const createAIProvider = async (input: {
  name: string
  apiKey: string
  baseUrl: string
}) => {
  const { generateDeApiKey } = await import('@server/lib/generate')
  const { rsaEncrypt } = await import('@server/lib/utils/rsa')
  await db.insert(dbSchema.aiProviders).values({
    name: input.name,
    apiKey: generateDeApiKey(input.apiKey),
    apiKeyHash: rsaEncrypt(input.apiKey),
    baseUrl: input.baseUrl,
  })
}

export const updateAIProvider = async (input: {
  id: string
  name: string
  baseUrl: string
}) => {
  await db
    .update(dbSchema.aiProviders)
    .set({
      name: input.name,
      baseUrl: input.baseUrl,
    })
    .where(eq(dbSchema.aiProviders.id, input.id))
}

export const updateAIProviderAPIKey = async (id: string, apiKey: string) => {
  const { generateDeApiKey } = await import('@server/lib/generate')
  const { rsaEncrypt } = await import('@server/lib/utils/rsa')

  await db
    .update(dbSchema.aiProviders)
    .set({
      apiKey: generateDeApiKey(apiKey),
      apiKeyHash: rsaEncrypt(apiKey),
    })
    .where(eq(dbSchema.aiProviders.id, id))
}

export const delAIProviderAPIKey = async (id: string) => {
  await db
    .delete(dbSchema.aiProviders)
    .where(eq(dbSchema.aiProviders.id, id))
    .returning()
}
