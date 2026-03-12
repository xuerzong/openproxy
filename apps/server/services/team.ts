import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { and, count, desc, eq, ilike } from 'drizzle-orm'
import { generateInviteCode } from '@server/lib/generate'

const TEAM_ROLES = ['owner', 'member'] as const

type TeamRole = (typeof TEAM_ROLES)[number]

interface TeamMetadata {
  disabled?: boolean
}

export class TeamServiceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'TeamServiceError'
  }
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

const assertTeamOwner = async (userId: string, teamId: string) => {
  const membership = await db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, teamId),
      eq(dbSchema.teamUsers.userId, userId)
    ),
  })

  if (!membership) {
    throw new TeamServiceError('FORBIDDEN', 403)
  }

  if (membership.role !== 'owner') {
    throw new TeamServiceError('ONLY_OWNER', 403)
  }

  return membership
}

const getTeamOwnerCount = async (teamId: string) => {
  const result = await db
    .select({ count: count() })
    .from(dbSchema.teamUsers)
    .where(
      and(
        eq(dbSchema.teamUsers.teamId, teamId),
        eq(dbSchema.teamUsers.role, 'owner')
      )
    )

  return result[0]?.count || 0
}

const getTeamMemberCount = async (teamId: string) => {
  const result = await db
    .select({ count: count() })
    .from(dbSchema.teamUsers)
    .where(eq(dbSchema.teamUsers.teamId, teamId))

  return result[0]?.count || 0
}

const resolveTeamRole = (role: string): TeamRole => {
  if (TEAM_ROLES.includes(role as TeamRole)) {
    return role as TeamRole
  }

  throw new TeamServiceError('INVALID_ROLE', 400)
}

export const getCurrentTeamMembers = async (teamId: string) => {
  return await db.query.teamUsers.findMany({
    where: eq(dbSchema.teamUsers.teamId, teamId),
    orderBy: desc(dbSchema.teamUsers.createdAt),
    with: {
      user: true,
    },
  })
}

export const updateCurrentTeam = async (
  userId: string,
  teamId: string,
  params: {
    name: string
  }
) => {
  await assertTeamOwner(userId, teamId)

  const [team] = await db
    .update(dbSchema.teams)
    .set({
      name: params.name.trim(),
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.teams.id, teamId))
    .returning()

  if (!team) {
    throw new TeamServiceError('TEAM_NOT_FOUND', 404)
  }

  return team
}

export const updateCurrentTeamMemberRole = async (
  userId: string,
  teamId: string,
  params: {
    id: string
    role: string
  }
) => {
  await assertTeamOwner(userId, teamId)
  const role = resolveTeamRole(params.role)

  const member = await db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, teamId),
      eq(dbSchema.teamUsers.id, params.id)
    ),
    with: {
      user: true,
    },
  })

  if (!member) {
    throw new TeamServiceError('TEAM_MEMBER_NOT_FOUND', 404)
  }

  if (member.role === 'owner' && role !== 'owner') {
    const ownerCount = await getTeamOwnerCount(teamId)
    if (ownerCount <= 1) {
      throw new TeamServiceError('LAST_OWNER', 409)
    }
  }

  const [updatedMember] = await db
    .update(dbSchema.teamUsers)
    .set({ role })
    .where(eq(dbSchema.teamUsers.id, params.id))
    .returning()

  if (!updatedMember) {
    throw new TeamServiceError('TEAM_MEMBER_NOT_FOUND', 404)
  }

  return {
    ...updatedMember,
    user: member.user,
  }
}

export const removeCurrentTeamMember = async (
  userId: string,
  teamId: string,
  memberId: string
) => {
  await assertTeamOwner(userId, teamId)

  const member = await db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, teamId),
      eq(dbSchema.teamUsers.id, memberId)
    ),
  })

  if (!member) {
    throw new TeamServiceError('TEAM_MEMBER_NOT_FOUND', 404)
  }

  if (member.userId === userId) {
    throw new TeamServiceError('SELF_REMOVE_NOT_ALLOWED', 400)
  }

  if (member.role === 'owner') {
    const ownerCount = await getTeamOwnerCount(teamId)
    if (ownerCount <= 1) {
      throw new TeamServiceError('LAST_OWNER', 409)
    }
  }

  const [deletedMember] = await db
    .delete(dbSchema.teamUsers)
    .where(eq(dbSchema.teamUsers.id, memberId))
    .returning({ id: dbSchema.teamUsers.id })

  if (!deletedMember) {
    throw new TeamServiceError('TEAM_MEMBER_NOT_FOUND', 404)
  }

  return deletedMember
}

export const deleteCurrentTeam = async (userId: string, teamId: string) => {
  await assertTeamOwner(userId, teamId)

  const memberships = await db.query.teamUsers.findMany({
    where: eq(dbSchema.teamUsers.userId, userId),
  })

  const [deletedTeam] = await db
    .delete(dbSchema.teams)
    .where(eq(dbSchema.teams.id, teamId))
    .returning({ id: dbSchema.teams.id })

  if (!deletedTeam) {
    throw new TeamServiceError('TEAM_NOT_FOUND', 404)
  }

  let nextTeamId = memberships.find((item) => item.teamId !== teamId)?.teamId

  if (!nextTeamId) {
    nextTeamId = await createTeam(userId)
  }

  return {
    success: true,
    nextTeamId,
  }
}

export const joinTeamByInviteCode = async (userId: string, inviteCode: string) => {
  const normalizedInviteCode = inviteCode.trim()
  const team = await db.query.teams.findFirst({
    where: eq(dbSchema.teams.inviteCode, normalizedInviteCode),
  })

  if (!team) {
    throw new TeamServiceError('TEAM_NOT_FOUND', 404)
  }

  if (parseTeamMetadata(team.metadata).disabled) {
    throw new TeamServiceError('TEAM_DISABLED', 403)
  }

  const existingMembership = await db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, team.id),
      eq(dbSchema.teamUsers.userId, userId)
    ),
    with: {
      user: true,
    },
  })

  if (existingMembership) {
    return {
      joined: false,
      alreadyMember: true,
      team,
      member: existingMembership,
    }
  }

  const memberCount = await getTeamMemberCount(team.id)
  if (memberCount >= team.usersLimit) {
    throw new TeamServiceError('TEAM_FULL', 409)
  }

  const [member] = await db
    .insert(dbSchema.teamUsers)
    .values({
      teamId: team.id,
      userId,
      role: 'member',
    })
    .returning()

  return {
    joined: true,
    alreadyMember: false,
    team,
    member,
  }
}
