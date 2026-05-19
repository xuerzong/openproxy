import { and, count, desc, eq, inArray, ne } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import Decimal from 'decimal.js'
import { getConfiguredAdminEmails } from '@server/lib/admin-role'

export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, email))
  return user
}

export const getUserConfig = async (userId: string) => {
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

export const getUserConfigWithBalance = async (userId: string) => {
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

export const updateUserEmailVerified = async (
  userId: string,
  emailVerified: boolean
) => {
  return db
    .update(dbSchema.users)
    .set({ emailVerified })
    .where(eq(dbSchema.users.id, userId))
    .returning()
}

export const getUsersWithConfig = async (limit: number, offset: number) => {
  return await db.query.users.findMany({
    limit,
    offset,
    orderBy: desc(dbSchema.users.createdAt),
    with: {
      config: true,
    },
  })
}

export const getUsersCount = async () => {
  const result = await db.select({ count: count() }).from(dbSchema.users)
  return result[0]?.count || 0
}

export const updateUserMonthlyFreeAllowance = async (
  userId: string,
  monthlyFreeAllowance: number
) => {
  await db
    .update(dbSchema.userConfigs)
    .set({
      monthlyFreeAllowance: new Decimal(monthlyFreeAllowance).toFixed(2),
    })
    .where(eq(dbSchema.userConfigs.userId, userId))
}

export const syncConfiguredAdminUsers = async () => {
  const adminEmails = getConfiguredAdminEmails()

  if (adminEmails.length === 0) {
    return {
      updatedCount: 0,
      emails: [],
    }
  }

  const updatedUsers = await db
    .update(dbSchema.users)
    .set({ role: 'admin' })
    .where(
      and(
        inArray(dbSchema.users.email, adminEmails),
        ne(dbSchema.users.role, 'admin')
      )
    )
    .returning({ email: dbSchema.users.email })

  return {
    updatedCount: updatedUsers.length,
    emails: updatedUsers
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email)),
  }
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
