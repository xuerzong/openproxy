import { Elysia } from 'elysia'
import {
  supportedModelOwnedBy,
  supportedModelStyles,
  supportedPayStatus,
} from '@server/lib/const'

export const constsRouter = new Elysia()
  .get('consts', async () => {
    return { supportedModelOwnedBy, supportedModelStyles, supportedPayStatus }
  })
