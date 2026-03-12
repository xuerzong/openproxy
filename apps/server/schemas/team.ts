import { t } from 'elysia'

export const UpdateCurrentTeamBodySchema = t.Object({
  name: t.String({ minLength: 1 }),
})

export const TeamMemberIdSchema = t.Object({
  id: t.String(),
})

export const UpdateCurrentTeamMemberRoleBodySchema = t.Object({
  id: t.String(),
  role: t.String({ minLength: 1 }),
})

export const JoinTeamByInviteCodeBodySchema = t.Object({
  inviteCode: t.String({ minLength: 4, maxLength: 16 }),
})