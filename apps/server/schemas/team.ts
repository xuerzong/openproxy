import { t } from 'elysia'
import {
  TeamNamePattern,
  TEAM_NAME_MIN,
  TEAM_NAME_MAX,
} from '@openproxy/schema/team'

const teamNamePattern = TeamNamePattern.source

export const CreateTeamBodySchema = t.Object({
  name: t.String({
    minLength: TEAM_NAME_MIN,
    maxLength: TEAM_NAME_MAX,
    pattern: teamNamePattern,
  }),
})

export const UpdateCurrentTeamBodySchema = t.Object({
  name: t.String({
    minLength: TEAM_NAME_MIN,
    maxLength: TEAM_NAME_MAX,
    pattern: teamNamePattern,
  }),
  allowJoin: t.Boolean(),
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
