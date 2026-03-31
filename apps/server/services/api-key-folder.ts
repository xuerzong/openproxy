import { and, asc, count, desc, eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

export class ApiKeyFolderServiceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiKeyFolderServiceError'
  }
}

const ensureTeamDefaultFolder = async (
  tx: Parameters<typeof db.transaction>[0] extends (arg: infer T) => unknown
    ? T
    : never,
  teamId: string
) => {
  const existingDefaultFolder = await tx.query.apiKeyFolders.findFirst({
    where: and(
      eq(dbSchema.apiKeyFolders.teamId, teamId),
      eq(dbSchema.apiKeyFolders.isDefault, true)
    ),
  })

  if (existingDefaultFolder) {
    return existingDefaultFolder
  }

  const fallbackFolder = await tx.query.apiKeyFolders.findFirst({
    where: eq(dbSchema.apiKeyFolders.teamId, teamId),
    orderBy: asc(dbSchema.apiKeyFolders.createdAt),
  })

  if (!fallbackFolder) {
    return null
  }

  const [folder] = await tx
    .update(dbSchema.apiKeyFolders)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(dbSchema.apiKeyFolders.id, fallbackFolder.id))
    .returning()

  return folder ?? null
}

export const getApiKeyFoldersByTeamId = async (teamId: string) => {
  return db.query.apiKeyFolders.findMany({
    where: eq(dbSchema.apiKeyFolders.teamId, teamId),
    orderBy: desc(dbSchema.apiKeyFolders.createdAt),
  })
}

export const getApiKeyFolderCountByTeamId = async (teamId: string) => {
  const [row] = await db
    .select({ value: count() })
    .from(dbSchema.apiKeyFolders)
    .where(eq(dbSchema.apiKeyFolders.teamId, teamId))
  return row?.value || 0
}

export const createApiKeyFolder = async (params: {
  teamId: string
  name: string
  isDefault?: boolean
}) => {
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

export const updateApiKeyFolder = async (params: {
  id: string
  teamId: string
  name: string
  isDefault?: boolean
}) => {
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

export const deleteApiKeyFolder = async (
  id: string,
  teamId: string,
  deleteAllApiKeys = false
) => {
  return db.transaction(async (tx) => {
    const folder = await tx.query.apiKeyFolders.findFirst({
      where: and(
        eq(dbSchema.apiKeyFolders.id, id),
        eq(dbSchema.apiKeyFolders.teamId, teamId)
      ),
    })
    if (!folder) {
      return null
    }
    if (folder.isDefault) {
      throw new ApiKeyFolderServiceError('DEFAULT_FOLDER_DELETE_FORBIDDEN', 409)
    }
    if (deleteAllApiKeys) {
      await tx
        .delete(dbSchema.apiKeys)
        .where(
          and(
            eq(dbSchema.apiKeys.folderId, id),
            eq(dbSchema.apiKeys.teamId, teamId)
          )
        )
    }
    const [deletedFolder] = await tx
      .delete(dbSchema.apiKeyFolders)
      .where(
        and(
          eq(dbSchema.apiKeyFolders.id, id),
          eq(dbSchema.apiKeyFolders.teamId, teamId)
        )
      )
      .returning()
    await ensureTeamDefaultFolder(tx, teamId)
    return deletedFolder
  })
}

// Admin functions
export const getApiKeyFoldersByTeamIdAdmin = async (teamId: string) => {
  return db.query.apiKeyFolders.findMany({
    where: eq(dbSchema.apiKeyFolders.teamId, teamId),
    orderBy: desc(dbSchema.apiKeyFolders.createdAt),
  })
}

export const deleteApiKeyFolderAdmin = async (
  id: string,
  deleteAllApiKeys = false
) => {
  return db.transaction(async (tx) => {
    const folder = await tx.query.apiKeyFolders.findFirst({
      where: eq(dbSchema.apiKeyFolders.id, id),
    })
    if (!folder) {
      return null
    }
    if (folder.isDefault) {
      throw new ApiKeyFolderServiceError('DEFAULT_FOLDER_DELETE_FORBIDDEN', 409)
    }
    if (deleteAllApiKeys) {
      await tx
        .delete(dbSchema.apiKeys)
        .where(
          and(
            eq(dbSchema.apiKeys.folderId, id),
            eq(dbSchema.apiKeys.teamId, folder.teamId)
          )
        )
    }
    const [deletedFolder] = await tx
      .delete(dbSchema.apiKeyFolders)
      .where(eq(dbSchema.apiKeyFolders.id, id))
      .returning()
    await ensureTeamDefaultFolder(tx, folder.teamId)
    return deletedFolder
  })
}
