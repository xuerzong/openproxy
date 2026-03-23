export const ExchangeRate = 10

export const IS_DEV = Bun.env.NODE_ENV === 'development'

export const IS_OSS = process.env.IS_OSS === 'true'

export const APP_DOMAIN = process.env.APP_DOMAIN || 'aiproxy.shop'

export const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  (IS_DEV ? 'http://localhost:5173' : `https://app.${APP_DOMAIN}`)

export const UserExperienceQuota = '1.00' // RMB

export const MAX_TEAMS_PER_USER = 5

export const TeamPlanLimits = {
  free: { usersLimit: 1, apiKeyLimit: 20 },
  pro: { usersLimit: 10, apiKeyLimit: 100 },
} as const

export type TeamPlan = keyof typeof TeamPlanLimits
