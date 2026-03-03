import { Elysia } from 'elysia'
import { auth } from '@server/lib/auth'
import { betterAuthPlugin } from '@server/routers/better-auth'
import {
  getUserByEmail,
  getUsersWithConfig,
  getUsersCount,
  updateUserEmailVerified,
  updateUserMonthlyFreeAllowance,
} from '@server/services/user'
import { rechargeUser } from '@server/services/order'
import {
  RechargeBodySchema,
  CreateUserBodySchema,
  PaginationQuerySchema,
  ChangeUserEmailVerifiedBodySchema,
  UpdateUserMonthlyFreeAllowanceBodySchema,
} from '@server/schemas'

export const adminUsersRouter = new Elysia()
  .use(betterAuthPlugin)
  .post(
    'recharge',
    async ({ body, set }) => {
      const targetUser = await getUserByEmail(body.email)
      if (!targetUser) {
        set.status = 404
        return 'User not found'
      }

      const orderId = await rechargeUser(body.email, body.amount)
      return orderId
    },
    {
      body: RechargeBodySchema,
      auth: { role: 'admin' },
    }
  )
  .post(
    'createUser',
    async ({ body }) => {
      await auth.api.signUpEmail({
        body: {
          name: body.email,
          email: body.email,
          password: body.password,
        },
      })
    },
    {
      auth: { role: 'admin' },
      body: CreateUserBodySchema,
    }
  )
  .get(
    'users',
    async ({ query }) => {
      return await getUsersWithConfig(query.limit, query.offset)
    },
    { auth: { role: 'admin' }, query: PaginationQuerySchema }
  )
  .get(
    'users/count',
    async () => {
      return await getUsersCount()
    },
    { auth: { role: 'admin' } }
  )
  .put(
    'changeUserEmailVerified',
    async ({ body }) => {
      return await updateUserEmailVerified(body.userId, body.emailVerified)
    },
    {
      auth: { role: 'admin' },
      body: ChangeUserEmailVerifiedBodySchema,
    }
  )
  .post(
    'updateUserMonthlyFreeAllowance',
    async ({ body }) => {
      await updateUserMonthlyFreeAllowance(
        body.userId,
        body.monthlyFreeAllowance
      )
    },
    {
      auth: { role: 'admin' },
      body: UpdateUserMonthlyFreeAllowanceBodySchema,
    }
  )
