import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import Decimal from 'decimal.js'

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, email))
  return user
}

export async function getUserConfig(userId: string) {
  const userConfigs = await db
    .select()
    .from(dbSchema.userConfigs)
    .where(eq(dbSchema.userConfigs.userId, userId))

  if (userConfigs.length > 0) {
    return userConfigs[0]
  }

  const newConfigs = await db
    .insert(dbSchema.userConfigs)
    .values({
      userId,
    })
    .returning()

  return newConfigs[0]
}

export async function getUserConfigWithBalance(userId: string) {
  const userConfig = await getUserConfig(userId)

  if (!userConfig) {
    throw new Error('User config not found')
  }

  return {
    totalTokenUsage: userConfig.totalTokenUsage,
    balance: new Decimal(userConfig.amount).minus(userConfig.cost).toFixed(2),
    monthlyFreeAllowance: Number(userConfig.monthlyFreeAllowance).toFixed(2),
    monthlyFreeUsed: Number(userConfig.monthlyFreeUsed).toFixed(2),
  }
}

export async function updateUserEmailVerified(
  userId: string,
  emailVerified: boolean
) {
  return db
    .update(dbSchema.users)
    .set({ emailVerified })
    .where(eq(dbSchema.users.id, userId))
    .returning()
}

export async function getUsersWithConfig(limit: number, offset: number) {
  return await db.query.users.findMany({
    limit,
    offset,
    orderBy: desc(dbSchema.users.createdAt),
    with: {
      config: true,
    },
  })
}

export async function getUsersCount() {
  const result = await db.select({ count: count() }).from(dbSchema.users)
  return result[0]?.count || 0
}

export async function updateUserMonthlyFreeAllowance(
  userId: string,
  monthlyFreeAllowance: number
) {
  await db
    .update(dbSchema.userConfigs)
    .set({
      monthlyFreeAllowance: new Decimal(monthlyFreeAllowance).toFixed(2),
    })
    .where(eq(dbSchema.userConfigs.userId, userId))
}

export const getUserTeamById = async (userId: string, teamId: string) => {
  const team = await db.query.teamUsers.findFirst({
    where: and(
      eq(dbSchema.teamUsers.teamId, teamId),
      eq(dbSchema.teamUsers.userId, userId)
    ),
    with: {
      team: true,
    },
  })

  return team
}
