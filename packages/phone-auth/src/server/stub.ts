import type { SmsProvider, CaptchaProvider, PhoneAuthConfig, PhoneAuthDeps, SmsResult } from './types'

/**
 * No-op SMS provider for open-source builds.
 * Phone login is disabled — always returns failure.
 */
export class NoOpSmsProvider implements SmsProvider {
  async sendSMS(_phoneNumber: string, _code: string): Promise<SmsResult> {
    console.warn('[phone-auth] SMS provider not configured')
    return { success: false, message: 'SMS provider not configured' }
  }

  async checkSMS(_phoneNumber: string, _verifyCode: string): Promise<SmsResult> {
    console.warn('[phone-auth] SMS provider not configured')
    return { success: false, message: 'SMS provider not configured' }
  }
}

/**
 * No-op captcha provider for open-source builds.
 * Always passes verification (no captcha required).
 */
export class NoOpCaptchaProvider implements CaptchaProvider {
  async verify(_params: any, _apiKey: string): Promise<any> {
    return { result: 'success' }
  }
}

/**
 * Empty plugin that registers no endpoints.
 * Used when phone login is not available.
 */
const noOpPhoneLoginPlugin = {
  id: 'phone-login' as const,
  endpoints: {},
} satisfies import('better-auth').BetterAuthPlugin

export function createPhoneAuthConfig(_deps?: PhoneAuthDeps): PhoneAuthConfig {
  return {
    smsProvider: new NoOpSmsProvider(),
    captchaProvider: new NoOpCaptchaProvider(),
    phoneLoginPlugin: noOpPhoneLoginPlugin,
  }
}
