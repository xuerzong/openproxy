import { and, desc, eq } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { generateApiKey, generateDeApiKey } from '@server/lib/generate'
import { hash } from '@server/lib/utils/hash'

export const ACCESS_TOKEN_SCOPES = [
  'api_keys:read',
  'api_keys:write',
  'balance:read',
] as const

export type AccessTokenScope = (typeof ACCESS_TOKEN_SCOPES)[number]

export const getAccessTokensByTeamId = async (teamId: string) => {
  return db.query.teamAccessTokens.findMany({
    where: eq(dbSchema.teamAccessTokens.teamId, teamId),
    orderBy: desc(dbSchema.teamAccessTokens.createdAt),
    columns: {
      id: true,
      name: true,
      token: true,
      scopes: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  })
}

export const createAccessToken = async (params: {
  teamId: string
  createdBy: string
  name: string
  scopes: string[]
  expiresAt: Date | null
}) => {
  const { teamId, createdBy, name, scopes, expiresAt } = params
  const rawToken = generateApiKey('oat-')
  const tokenHash = await hash(rawToken)

  await db.insert(dbSchema.teamAccessTokens).values({
    teamId,
    createdBy,
    name,
    token: generateDeApiKey(rawToken),
    tokenHash,
    scopes,
    expiresAt,
  })

  return rawToken
}

export const deleteAccessToken = async (id: string, teamId: string) => {
  await db
    .delete(dbSchema.teamAccessTokens)
    .where(
      and(
        eq(dbSchema.teamAccessTokens.id, id),
        eq(dbSchema.teamAccessTokens.teamId, teamId)
      )
    )
}

export const validateAccessToken = async (rawToken: string) => {
  const tokenHash = await hash(rawToken)
  const record = await db.query.teamAccessTokens.findFirst({
    where: eq(dbSchema.teamAccessTokens.tokenHash, tokenHash),
    columns: {
      id: true,
      teamId: true,
      scopes: true,
      expiresAt: true,
    },
  })

  if (!record) {
    return null
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return null
  }

  await db
    .update(dbSchema.teamAccessTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(dbSchema.teamAccessTokens.id, record.id))

  return {
    id: record.id,
    teamId: record.teamId,
    scopes: record.scopes as AccessTokenScope[],
  }
}
