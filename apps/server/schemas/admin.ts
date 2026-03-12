import { t } from 'elysia'

// Recharge request body
export const RechargeBodySchema = t.Object({
  email: t.String(),
  amount: t.Number(),
})

// Create user request body
export const CreateUserBodySchema = t.Object({
  email: t.String(),
  password: t.String(),
})

// Update user email verification status request body
export const ChangeUserEmailVerifiedBodySchema = t.Object({
  emailVerified: t.Boolean(),
  userId: t.String(),
})

// Update user monthly free allowance request body
export const UpdateUserMonthlyFreeAllowanceBodySchema = t.Object({
  monthlyFreeAllowance: t.Numeric(),
  userId: t.String(),
})

export const AdminTeamsQuerySchema = t.Object({
  limit: t.Numeric(),
  offset: t.Numeric(),
  keyword: t.Optional(t.String()),
})

export const UpdateAdminTeamBodySchema = t.Object({
  id: t.String(),
  name: t.String({ minLength: 1 }),
  inviteCode: t.String({ minLength: 4, maxLength: 16 }),
  apiKeyLimit: t.Numeric({ minimum: 1 }),
  usersLimit: t.Numeric({ minimum: 1 }),
})

export const AdminTeamIdSchema = t.Object({
  id: t.String(),
})

export const UpdateAdminTeamStatusBodySchema = t.Object({
  id: t.String(),
  disabled: t.Boolean(),
})
