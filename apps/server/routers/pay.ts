import Elysia, { status, t } from 'elysia'
import { generateOrderId } from '@server/lib/generate'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { PayStatus, PayType } from '@server/constants/pay'
import Decimal from 'decimal.js'
import { and, count, eq, gte } from 'drizzle-orm'
import { pascalCase } from 'string-ts'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'
import { CLIENT_ORIGIN } from '@server/constants'
import { ZpayzPaymentProvider } from '@openproxy/payment-provider'
import { createTeamOrder, settleTeamOrder } from '@server/services/order'

const ZPAYZ_CID = process.env.ZPAYZ_CID?.trim()
const ZPAYZ_PID = process.env.ZPAYZ_PID?.trim()
const ZPAYZ_PAY_KEY = process.env.ZPAYZ_PAY_KEY?.trim()
const ZPAYZ_GATEWAY = process.env.ZPAYZ_GATEWAY?.trim()

const paymentProvider =
  ZPAYZ_CID && ZPAYZ_PID && ZPAYZ_PAY_KEY && ZPAYZ_GATEWAY
    ? new ZpayzPaymentProvider({
        cid: ZPAYZ_CID,
        pid: ZPAYZ_PID,
        payKey: ZPAYZ_PAY_KEY,
        gateway: ZPAYZ_GATEWAY,
      })
    : null

export const payRouter = new Elysia({ name: 'pay-router', prefix: '/pay' })
  .use(betterAuthPlugin)
  .get(
    '/notify',
    async ({ query, status }) => {
      if (!paymentProvider) {
        return status(503, {
          success: false,
          message: 'Payment is disabled',
          code: 'PAYMENT_DISABLED',
        })
      }

      const { sign, sign_type, ...params } = query

      if (
        !paymentProvider.verifyNotify({
          sign: sign ?? '',
          sign_type: sign_type ?? '',
          ...params,
        })
      ) {
        return status(400, {
          mesage: '',
          success: false,
          code: 'BAD_REQUEST',
        })
      }

      const orderId = params.out_trade_no || ''

      const completeOrderId = await db.transaction(async (tx) => {
        const orderStatus =
          query.trade_status === 'TRADE_SUCCESS'
            ? PayStatus.SUCCESS
            : PayStatus.FAIL

        const order = await settleTeamOrder(tx, {
          orderId,
          status: orderStatus,
          tradeNo: params.trade_no,
        })

        if (!order) {
          return { success: false }
        }

        return orderId
      })

      return { success: Boolean(completeOrderId) }
    },
    {
      query: t.Partial(
        t.Object({
          pid: t.Numeric(),
          name: t.String(),
          money: t.String(),
          out_trade_no: t.String(),
          trade_no: t.String(),
          param: t.String(),
          trade_status: t.String(),
          type: t.String(),
          sign: t.String(),
          sign_type: t.String(),
        })
      ),
    }
  )

  .post(
    '/qrCodeUrl',
    async ({ teamUserId, teamId, body }) => {
      if (!paymentProvider) {
        return status(503, {
          success: false,
          message: 'Payment is disabled',
          code: 'PAYMENT_DISABLED',
        })
      }

      const ordersRow = await db
        .select({ count: count() })
        .from(dbSchema.orders)
        .where(
          and(
            eq(dbSchema.orders.teamId, teamId),
            eq(dbSchema.orders.status, PayStatus.PENDING),
            gte(
              dbSchema.orders.createdAt,
              new Date(Date.now() - 15 * 60 * 1000)
            )
          )
        )

      const ordersCount = ordersRow[0]?.count || 0

      if (ordersCount >= 5) {
        return status(429, {
          success: false,
          message: '您有太多的未支付订单，请先完成支付或等待过期',
          code: 'TOO_MANY_PENDING_ORDERS',
        })
      }

      const amount = new Decimal(body.amount).toFixed(2)
      const type = body.type

      const { orderId } = await createTeamOrder(db, {
        teamId,
        userId: teamUserId,
        amount,
        status: PayStatus.PENDING,
        type: PayType[pascalCase(body.type) as 'Alipay'],
      })

      const redirectUrl = paymentProvider.createQrCodeUrl({
        amount,
        type,
        orderId,
        notifyUrl: `${CLIENT_ORIGIN}/api/pay/notify`,
        returnUrl: `${CLIENT_ORIGIN}`,
      })

      return redirectUrl
    },
    {
      body: t.Object({
        amount: t.Number(),
        type: t.String(),
      }),
      auth: { role: true },
      team: true,
    }
  )
  .get(
    'status',
    async ({ query, teamId, status }) => {
      if (!paymentProvider) {
        return status(503, {
          success: false,
          message: 'Payment is disabled',
          code: 'PAYMENT_DISABLED',
        })
      }

      const order = await db.query.orders.findFirst({
        where: and(
          eq(dbSchema.orders.orderId, query.orderId),
          eq(dbSchema.orders.teamId, teamId)
        ),
        columns: {
          status: true,
        },
      })

      if (!order) {
        return status(404)
      }
      return Number(order.status)
    },
    {
      auth: { role: true },
      team: true,
      query: t.Object({ orderId: t.String() }),
    }
  )
