import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { and, count, desc, eq, ilike } from 'drizzle-orm'
import { generateInviteCode } from '@server/lib/generate'

interface TeamMetadata {
  disabled?: boolean
}

export const parseTeamMetadata = (metadata?: string | null): TeamMetadata => {
  if (!metadata) {
    return {}
  }

  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch {
    return {}
  }
}

const stringifyTeamMetadata = (metadata: TeamMetadata) => {
  if (Object.keys(metadata).length === 0) {
    return null
  }

  return JSON.stringify(metadata)
}

const toAdminTeamView = (
  team: typeof dbSchema.teams.$inferSelect,
  memberCount = 0
) => ({
  ...team,
  disabled: Boolean(parseTeamMetadata(team.metadata).disabled),
  memberCount,
})

export const createTeam = async (userId: string) => {
  const teamId = await db.transaction(async (tx) => {
    const teamRows = await tx
      .insert(dbSchema.teams)
      .values({
        name: userId.slice(0, 6) + '的团队',
      })
      .returning({ id: dbSchema.teams.id })

    const teamId = teamRows[0]?.id!

    await tx.insert(dbSchema.teamUsers).values({
      userId,
      teamId,
      role: 'owner',
    })

    return teamId
  })

  return teamId
}

export const getTeams = (userId: string) => {
  return db.query.teamUsers.findMany({
    where: eq(dbSchema.teamUsers.userId, userId),
  })
}

export const getTeamById = (teamUserId: string, teamId: string) => {
  return db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, teamId),
      eq(dbSchema.teamUsers.id, teamUserId)
    ),
    with: {
      team: true,
    },
  })
}

export const getAdminTeams = async (
  limit: number,
  offset: number,
  keyword?: string
) => {
  const normalizedKeyword = keyword?.trim()

  const teams = normalizedKeyword
    ? await db
        .select()
        .from(dbSchema.teams)
        .where(ilike(dbSchema.teams.name, `%${normalizedKeyword}%`))
        .orderBy(desc(dbSchema.teams.createdAt))
        .offset(offset)
        .limit(limit)
    : await db.query.teams.findMany({
        limit,
        offset,
        orderBy: desc(dbSchema.teams.createdAt),
      })

  const teamCounts = await db
    .select({
      teamId: dbSchema.teamUsers.teamId,
      memberCount: count(),
    })
    .from(dbSchema.teamUsers)
    .groupBy(dbSchema.teamUsers.teamId)

  const memberCountMap = new Map(
    teamCounts.map((item) => [item.teamId, item.memberCount])
  )

  return teams.map((team) =>
    toAdminTeamView(team, memberCountMap.get(team.id) || 0)
  )
}

export const getAdminTeamsCount = async (keyword?: string) => {
  const normalizedKeyword = keyword?.trim()

  const result = normalizedKeyword
    ? await db
        .select({ count: count() })
        .from(dbSchema.teams)
        .where(ilike(dbSchema.teams.name, `%${normalizedKeyword}%`))
    : await db.select({ count: count() }).from(dbSchema.teams)

  return result[0]?.count || 0
}

export const updateAdminTeam = async (params: {
  id: string
  name: string
  inviteCode: string
  apiKeyLimit: number
  usersLimit: number
}) => {
  const [team] = await db
    .update(dbSchema.teams)
    .set({
      name: params.name.trim(),
      inviteCode: params.inviteCode.trim(),
      apiKeyLimit: params.apiKeyLimit,
      usersLimit: params.usersLimit,
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.teams.id, params.id))
    .returning()

  return team ? toAdminTeamView(team) : team
}

export const getAdminTeamMembers = async (teamId: string) => {
  return await db.query.teamUsers.findMany({
    where: eq(dbSchema.teamUsers.teamId, teamId),
    orderBy: desc(dbSchema.teamUsers.createdAt),
    with: {
      user: true,
    },
  })
}

export const resetAdminTeamInviteCode = async (id: string) => {
  const [team] = await db
    .update(dbSchema.teams)
    .set({
      inviteCode: generateInviteCode(),
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.teams.id, id))
    .returning()

  return team ? toAdminTeamView(team) : team
}

export const setAdminTeamDisabled = async (id: string, disabled: boolean) => {
  const team = await db.query.teams.findFirst({
    where: eq(dbSchema.teams.id, id),
  })

  if (!team) {
    return null
  }

  const metadata = parseTeamMetadata(team.metadata)
  const [updatedTeam] = await db
    .update(dbSchema.teams)
    .set({
      metadata: stringifyTeamMetadata({
        ...metadata,
        disabled,
      }),
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.teams.id, id))
    .returning()

  return updatedTeam ? toAdminTeamView(updatedTeam) : updatedTeam
}

export const deleteAdminTeam = async (id: string) => {
  const [team] = await db
    .delete(dbSchema.teams)
    .where(eq(dbSchema.teams.id, id))
    .returning({ id: dbSchema.teams.id })

  return team
}
