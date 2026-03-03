import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/routers/better-auth'
import { PaginationQuerySchema } from '@server/schemas'
import { getOrders, getOrdersCount } from '@server/services/order'

export const adminOrdersRouter = new Elysia({
  prefix: '/admin',
})
  .use(betterAuthPlugin)
  .get(
    '/orders',
    async ({ query }) => {
      return await getOrders(query.limit, query.offset)
    },
    { auth: { role: 'admin' }, query: PaginationQuerySchema }
  )
  .get(
    '/orders/count',
    async () => {
      return await getOrdersCount()
    },
    { auth: { role: 'admin' } }
  )
