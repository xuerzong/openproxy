import { and, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import Decimal from 'decimal.js'
import { generateOrderId } from '@server/lib/generate'
import { PayStatus, PayType } from '@server/constants/pay'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbExecutor = typeof db | DbTransaction

export const createTeamOrder = async (
  database: DbExecutor,
  params: {
    teamId: string
    userId: string
    amount: number | string
    type: number
    status?: number
    tradeNo?: string
    orderId?: string
  }
) => {
  const amount = new Decimal(params.amount).toFixed(2)
  const orderId = params.orderId || generateOrderId()
  await database.insert(dbSchema.orders).values({
    teamId: params.teamId,
    userId: params.userId,
    amount,
    status: params.status ?? PayStatus.PENDING,
    orderId,
    tradeNo: params.tradeNo?.trim() || '',
    type: params.type,
  })
  return {
    orderId,
    amount,
  }
}

export const settleTeamOrder = async (
  database: DbExecutor,
  params: {
    orderId: string
    status: number
    tradeNo?: string
  }
) => {
  const [order] = await database
    .update(dbSchema.orders)
    .set({
      status: params.status,
      tradeNo: params.tradeNo?.trim() || '',
    })
    .where(
      and(
        eq(dbSchema.orders.orderId, params.orderId),
        eq(dbSchema.orders.status, PayStatus.PENDING)
      )
    )
    .returning({
      orderId: dbSchema.orders.orderId,
      teamId: dbSchema.orders.teamId,
      amount: dbSchema.orders.amount,
      status: dbSchema.orders.status,
    })
  if (!order) {
    return null
  }
  if (params.status === PayStatus.SUCCESS) {
    await database
      .update(dbSchema.teams)
      .set({
        amount: sql`${dbSchema.teams.amount} + ${order.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(dbSchema.teams.id, order.teamId))
  }
  return order
}

export const rechargeUser = async (email: string, amount: number) => {
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
        status: PayStatus.SUCCESS,
        orderId: generateOrderId(),
        type: PayType.WechatPay,
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

export const getOrdersByTeamId = async (
  teamId: string,
  limit: number,
  offset: number
) => {
  return await db
    .select()
    .from(dbSchema.orders)
    .where(eq(dbSchema.orders.teamId, teamId))
    .orderBy(desc(dbSchema.orders.createdAt))
    .offset(offset)
    .limit(limit)
}

export const getOrdersCountByTeamId = async (teamId: string) => {
  const result = await db
    .select({ count: count() })
    .from(dbSchema.orders)
    .where(and(eq(dbSchema.orders.teamId, teamId)))
  return result[0]?.count || 0
}

export const getOrders = async (limit: number, offset: number) => {
  return await db
    .select()
    .from(dbSchema.orders)
    .orderBy(desc(dbSchema.orders.createdAt))
    .offset(offset)
    .limit(limit)
}

export const getOrdersCount = async () => {
  const result = await db.select({ count: count() }).from(dbSchema.orders)
  return result[0]?.count || 0
}
