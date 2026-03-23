import { Elysia } from 'elysia'
import { betterAuthPlugin } from '@server/plugins/better-auth'
import {
  CreateTeamBodySchema,
  JoinTeamByInviteCodeBodySchema,
  TeamMemberIdSchema,
  UpdateCurrentTeamBodySchema,
  UpdateCurrentTeamMemberRoleBodySchema,
  UpgradeTeamPlanBodySchema,
} from '@server/schemas'
import {
  TeamServiceError,
  createTeamForUser,
  deleteCurrentTeam,
  getCurrentTeamMembers,
  joinTeamByInviteCode,
  removeCurrentTeamMember,
  updateCurrentTeam,
  updateCurrentTeamMemberRole,
  upgradeTeamPlan,
} from '@server/services/team'

const applyTeamServiceError = (
  error: unknown,
  set: { status?: number | string }
) => {
  if (error instanceof TeamServiceError) {
    set.status = error.status
    return error.message
  }

  throw error
}

export const teamRouter = new Elysia()
  .use(betterAuthPlugin)
  .post(
    '/team',
    async ({ user, body, set }) => {
      try {
        return await createTeamForUser(user.id, body.name)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      body: CreateTeamBodySchema,
    }
  )
  .get(
    '/team/members',
    async ({ teamId }) => {
      return await getCurrentTeamMembers(teamId)
    },
    { auth: { role: true }, team: true }
  )
  .put(
    '/team',
    async ({ user, teamId, body, set }) => {
      try {
        return await updateCurrentTeam(user.id, teamId, body)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      team: true,
      body: UpdateCurrentTeamBodySchema,
    }
  )
  .delete(
    '/team',
    async ({ user, teamId, set }) => {
      try {
        return await deleteCurrentTeam(user.id, teamId)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    { auth: { role: true }, team: true }
  )
  .put(
    '/team/members/role',
    async ({ user, teamId, body, set }) => {
      try {
        return await updateCurrentTeamMemberRole(user.id, teamId, body)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      team: true,
      body: UpdateCurrentTeamMemberRoleBodySchema,
    }
  )
  .delete(
    '/team/members/:id',
    async ({ user, teamId, params, set }) => {
      try {
        return await removeCurrentTeamMember(user.id, teamId, params.id)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      team: true,
      params: TeamMemberIdSchema,
    }
  )
  .post(
    '/team/join',
    async ({ user, body, set }) => {
      try {
        return await joinTeamByInviteCode(user.id, body.inviteCode)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      body: JoinTeamByInviteCodeBodySchema,
    }
  )
  .put(
    '/team/plan',
    async ({ user, teamId, body, set }) => {
      try {
        return await upgradeTeamPlan(user.id, teamId, body.plan)
      } catch (error) {
        return applyTeamServiceError(error, set)
      }
    },
    {
      auth: { role: true },
      team: true,
      body: UpgradeTeamPlanBodySchema,
    }
  )
