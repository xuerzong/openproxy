import { Elysia } from 'elysia'
import {
  supportedModelOwnedBy,
  supportedModelStyles,
  supportedPayStatus,
} from '@server/lib/const'
import { ACCESS_TOKEN_SCOPES } from '@server/services/access-token'
import {
  IS_OSS,
  MAX_TEAMS_PER_USER,
  APP_DOMAIN,
  TeamPlanLimits,
} from '@server/constants'

export const constsRouter = new Elysia().get('consts', async () => {
  return {
    supportedModelOwnedBy,
    supportedModelStyles,
    supportedPayStatus,
    accessTokenScopes: ACCESS_TOKEN_SCOPES,
    isOSS: IS_OSS,
    maxTeamsPerUser: IS_OSS ? null : MAX_TEAMS_PER_USER,
    appDomain: APP_DOMAIN,
    teamPlanLimits: IS_OSS ? null : TeamPlanLimits,
  }
})
