import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import Decimal from 'decimal.js'
import { openApiAuthPlugin } from '@server/plugins/openapi-auth'
import { db } from '@server/lib/db/client'
import * as dbSchema from '@server/lib/db/schema'

export const openApiBalanceRouter = new Elysia({ prefix: '/balance' })
  .use(openApiAuthPlugin)
  .get(
    '/',
    async ({ accessToken }) => {
      return await getTeamBalance(accessToken.teamId)
    },
    { openapi: { scope: 'balance:read' } }
  )

const getTeamBalance = async (teamId: string) => {
  const team = await db.query.teams.findFirst({
    where: eq(dbSchema.teams.id, teamId),
    columns: { id: true, amount: true },
  })

  if (!team) {
    throw new Error('Team not found')
  }

  return {
    teamId: team.id,
    balance: new Decimal(team.amount).toFixed(2),
  }
}
