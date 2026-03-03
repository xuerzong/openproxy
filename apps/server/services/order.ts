import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import Decimal from 'decimal.js'
import { generateOrderId } from '@server/lib/generate'

export async function rechargeUser(email: string, amount: number) {
  const decimalAmount = new Decimal(amount)

  return await db.transaction(async (tx) => {
    const [targetUser] = await tx
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, email))

    if (!targetUser) {
      tx.rollback()
      return null
    }

    const [newOrder] = await tx
      .insert(dbSchema.orders)
      .values({
        teamId: '', // TODO
        userId: targetUser.id,
        amount: decimalAmount.toString(),
        status: 1,
        orderId: generateOrderId(),
        type: 2,
      })
      .returning()

    await tx
      .update(dbSchema.userConfigs)
      .set({
        amount: sql`${dbSchema.userConfigs.amount} + ${decimalAmount.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(dbSchema.userConfigs.userId, targetUser.id))

    return newOrder?.orderId
  })
}

export async function getOrdersByTeamId(
  teamId: string,
  limit: number,
  offset: number
) {
  return await db
    .select()
    .from(dbSchema.orders)
    .where(eq(dbSchema.orders.teamId, teamId))
    .orderBy(desc(dbSchema.orders.createdAt))
    .offset(offset)
    .limit(limit)
}

export async function getOrdersCountByTeamId(teamId: string) {
  const result = await db
    .select({ count: count() })
    .from(dbSchema.orders)
    .where(and(eq(dbSchema.orders.teamId, teamId)))
  return result[0]?.count || 0
}

export async function getOrders(limit: number, offset: number) {
  return await db
    .select()
    .from(dbSchema.orders)
    .orderBy(desc(dbSchema.orders.createdAt))
    .offset(offset)
    .limit(limit)
}

export async function getOrdersCount() {
  const result = await db.select({ count: count() }).from(dbSchema.orders)
  return result[0]?.count || 0
}
