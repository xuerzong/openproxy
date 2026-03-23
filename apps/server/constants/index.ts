export const ExchangeRate = 10

export const IS_DEV = Bun.env.NODE_ENV === 'development'

export const IS_OSS = process.env.IS_OSS !== 'false'

export const APP_DOMAIN = process.env.APP_DOMAIN || 'aiproxy.shop'

export const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  (IS_DEV ? 'http://localhost:5173' : `https://app.${APP_DOMAIN}`)

export const UserExperienceQuota = '1.00' // RMB

export const MAX_TEAMS_PER_USER = 5
