export type { SmsProvider, CaptchaProvider, PhoneAuthConfig, PhoneAuthDeps, SmsResult } from './types'

// Private deployment: real implementation
// This file is frozen via `git update-index --skip-worktree` and must NOT be committed.
export { createPhoneAuthConfig } from './alicloud'
