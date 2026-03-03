import type { BetterAuthPlugin } from 'better-auth'

/**
 * Result of an SMS send or verify operation.
 */
export interface SmsResult {
  success: boolean
  message?: string
  code?: string
  requestId?: string
  data?: any
  recommend?: string
}

/**
 * Abstraction over SMS services (send OTP, verify OTP).
 */
export interface SmsProvider {
  sendSMS(phoneNumber: string, code: string): Promise<SmsResult>
  checkSMS(phoneNumber: string, verifyCode: string): Promise<SmsResult>
}

/**
 * Abstraction over captcha verification services.
 */
export interface CaptchaProvider {
  verify(params: any, apiKey: string): Promise<any>
}

/**
 * Configuration for phone-auth features injected into better-auth.
 */
export interface PhoneAuthConfig {
  smsProvider: SmsProvider
  captchaProvider: CaptchaProvider
  phoneLoginPlugin: BetterAuthPlugin
}

/**
 * Dependencies injected by the host application.
 * This keeps the package decoupled from any specific DB layer.
 */
export interface PhoneAuthDeps {
  findUserByPhone: (phoneNumber: string) => Promise<any>
}
