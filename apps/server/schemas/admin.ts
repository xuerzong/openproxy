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
