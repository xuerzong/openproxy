import { Elysia } from 'elysia'
import {
  validateAccessToken,
  type AccessTokenScope,
} from '@server/services/access-token'
import { rateLimit } from '@server/lib/rate-limit'

const RATE_LIMIT = 30 // requests per window
const RATE_WINDOW = 60 // seconds

export const openApiAuthPlugin = new Elysia({
  name: 'openapi-auth-plugin',
}).macro({
  openapi: ({ scope }: { scope: AccessTokenScope }) => ({
    resolve: async ({
      set,
      request: { headers },
    }: {
      set: {
        status?: number | string
        headers: Record<string, string | number>
      }
      request: { headers: Headers }
    }) => {
      const authHeader = headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        set.status = 401
        throw new Error('Missing or invalid Authorization header')
      }

      const token = authHeader.slice(7)
      const result = await validateAccessToken(token)
      if (!result) {
        set.status = 401
        throw new Error('Invalid or expired access token')
      }

      // Rate limit per access token: 30 req/min
      const rl = await rateLimit(
        `openapi:${result.id}`,
        RATE_LIMIT,
        RATE_WINDOW
      )
      set.headers['X-RateLimit-Limit'] = String(rl.limit)
      set.headers['X-RateLimit-Remaining'] = String(rl.remaining)
      set.headers['X-RateLimit-Reset'] = String(rl.reset)

      if (!rl.success) {
        set.status = 429
        throw new Error('Rate limit exceeded. Try again later.')
      }

      if (!result.scopes.includes(scope)) {
        set.status = 403
        throw new Error(`Missing scope: ${scope}`)
      }

      return { accessToken: result }
    },
  }),
})
