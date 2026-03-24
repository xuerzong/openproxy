import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

export async function getApiKeyFoldersByTeamId(teamId: string) {
  return db.query.apiKeyFolders.findMany({
    where: eq(dbSchema.apiKeyFolders.teamId, teamId),
    orderBy: desc(dbSchema.apiKeyFolders.createdAt),
  })
}

export async function getApiKeyFolderCountByTeamId(teamId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(dbSchema.apiKeyFolders)
    .where(eq(dbSchema.apiKeyFolders.teamId, teamId))

  return row?.value || 0
}

export async function createApiKeyFolder(params: {
  teamId: string
  name: string
  isDefault?: boolean
}) {
  const { teamId, name, isDefault = false } = params

  return db.transaction(async (tx) => {
    if (isDefault) {
      await tx
        .update(dbSchema.apiKeyFolders)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(dbSchema.apiKeyFolders.teamId, teamId),
            eq(dbSchema.apiKeyFolders.isDefault, true)
          )
        )
    }

    const [folder] = await tx
      .insert(dbSchema.apiKeyFolders)
      .values({ teamId, name, isDefault })
      .returning()

    return folder!
  })
}

export async function updateApiKeyFolder(params: {
  id: string
  teamId: string
  name: string
  isDefault?: boolean
}) {
  const { id, teamId, name, isDefault } = params

  return db.transaction(async (tx) => {
    if (isDefault) {
      await tx
        .update(dbSchema.apiKeyFolders)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(dbSchema.apiKeyFolders.teamId, teamId),
            eq(dbSchema.apiKeyFolders.isDefault, true)
          )
        )
    }

    const [folder] = await tx
      .update(dbSchema.apiKeyFolders)
      .set({
        name,
        isDefault: isDefault ?? false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dbSchema.apiKeyFolders.id, id),
          eq(dbSchema.apiKeyFolders.teamId, teamId)
        )
      )
      .returning()

    return folder
  })
}

export async function deleteApiKeyFolder(id: string, teamId: string) {
  const [folder] = await db
    .delete(dbSchema.apiKeyFolders)
    .where(
      and(
        eq(dbSchema.apiKeyFolders.id, id),
        eq(dbSchema.apiKeyFolders.teamId, teamId)
      )
    )
    .returning()

  return folder
}

// Admin functions
export async function getApiKeyFoldersByTeamIdAdmin(teamId: string) {
  return db.query.apiKeyFolders.findMany({
    where: eq(dbSchema.apiKeyFolders.teamId, teamId),
    orderBy: desc(dbSchema.apiKeyFolders.createdAt),
  })
}

export async function deleteApiKeyFolderAdmin(id: string) {
  const [folder] = await db
    .delete(dbSchema.apiKeyFolders)
    .where(eq(dbSchema.apiKeyFolders.id, id))
    .returning()

  return folder
}
