import { Elysia } from 'elysia'
import { auth } from '@server/lib/auth'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import { getTeams } from '@server/services/team'

export const betterAuthRouter = new Elysia({
  name: 'better-auth',
})
  .use(betterAuthPlugin)
  .mount(auth.handler)
  .get('/api/auth/login-methods', () => {
    return {
      github: Boolean(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
      google: Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    }
  })
  .get(
    '/api/auth/teams',
    async ({ user }) => {
      return getTeams(user.id)
    },
    { auth: { role: true } }
  )
  .post('/api/auth/set-password', async ({ body, request, set }) => {
    const newPassword =
      body && typeof body === 'object' && 'newPassword' in body
        ? (body.newPassword as string)
        : ''

    if (!newPassword) {
      set.status = 400
      return {
        message: 'newPassword is required',
      }
    }

    try {
      return await auth.api.setPassword({
        headers: request.headers,
        body: {
          newPassword,
        },
      })
    } catch (error: any) {
      if (typeof error?.statusCode === 'number') {
        set.status = error.statusCode
      }
      if (typeof error?.status === 'number') {
        set.status = error.status
      }
      return {
        message: error?.message || 'Set password failed',
      }
    }
  })
