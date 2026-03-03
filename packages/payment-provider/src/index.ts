export type {
  PaymentProvider,
  CreateQrCodeUrlParams,
  NotifyParams,
} from './types'

// Private deployment: real implementation
// This file is frozen via `git update-index --skip-worktree` and must NOT be committed.
export type { ZpayzConfig } from './zpayz'
export { ZpayzPaymentProvider } from './zpayz'
