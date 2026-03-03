import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { and, eq } from 'drizzle-orm'

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
