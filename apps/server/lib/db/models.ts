import { and, asc, desc, eq, or } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

interface GetModelsInput {
  userId?: string | null
}

export const getModels = async (input?: GetModelsInput) => {
  const userId = input?.userId

  const models = await db
    .select()
    .from(dbSchema.models)
    .where(and(eq(dbSchema.models.isPublic, true)))
    .orderBy(
      asc(dbSchema.models.ownedBy),
      asc(dbSchema.models.id),
      desc(dbSchema.models.updatedAt)
    )
  return models
}

export const getModel = async (modelId: string) => {
  const models = await db
    .select()
    .from(dbSchema.models)
    .where(eq(dbSchema.models.id, modelId))
  return models[0]
}
