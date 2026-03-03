/**
 * ⚠️  This file contains proprietary Alibaba Cloud SMS + Geetest logic.
 *    Keep this package out of any public repository.
 */

import Dypnsapi, {
  CheckSmsVerifyCodeRequest,
  SendSmsVerifyCodeRequest,
} from '@alicloud/dypnsapi20170525'
import { Config } from '@alicloud/openapi-client'
import Credential from '@alicloud/credentials'
import { RuntimeOptions } from '@alicloud/tea-util'
import { createAuthEndpoint } from 'better-auth/api'
import { z } from 'zod'
import { setSessionCookie } from 'better-auth/cookies'
import type { BetterAuthPlugin } from 'better-auth'
import type { SmsProvider, CaptchaProvider, PhoneAuthConfig, PhoneAuthDeps, SmsResult } from './types'

// ---------------------------------------------------------------------------
// Alibaba Cloud SMS
// ---------------------------------------------------------------------------
const createClient = () => {
  const CredentialCon = (Credential as any).default || Credential
  const DypnsapiCon: any = (Dypnsapi as any).default || Dypnsapi
  const config = new Config({
    credential: new CredentialCon(),
    endpoint: 'dypnsapi.aliyuncs.com',
  })
  return new DypnsapiCon(config)
}

const client = createClient()

export class AliCloudSmsProvider implements SmsProvider {
  async sendSMS(phoneNumber: string, code: string): Promise<SmsResult> {
    const request = new SendSmsVerifyCodeRequest({
      phoneNumber,
      signName: '速通互联验证码',
      templateCode: '100001',
      templateParam: JSON.stringify({ code, min: '5' }),
    })

    try {
      const response = await client.sendSmsVerifyCode(request)
      if (response.body?.code === 'OK') {
        return {
          success: true,
          message: 'Verification code sent successfully',
          requestId: response.body.requestId,
        }
      }
      return {
        success: false,
        code: response.body?.code,
        message: response.body?.message,
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Internal Server Error' }
    }
  }

  async checkSMS(phoneNumber: string, verifyCode: string): Promise<SmsResult> {
    const request = new CheckSmsVerifyCodeRequest({
      phoneNumber: phoneNumber.replace(/^\+86/, ''),
      verifyCode,
    })
    const runtime = new RuntimeOptions({})

    try {
      const response = await client.checkSmsVerifyCodeWithOptions(request, runtime)
      if (response.body?.code === 'OK') {
        return { success: true, data: response.body }
      }
      return {
        success: false,
        message: response.body?.message,
        code: response.body?.code,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        recommend: error.data?.Recommend,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Geetest captcha verification
// ---------------------------------------------------------------------------
export class GeetestCaptchaProvider implements CaptchaProvider {
  async verify(params: any, prikey: string): Promise<any> {
    const sign_token = new Bun.CryptoHasher('sha256', prikey)
      .update(params.lot_number)
      .digest('hex')

    const queryParams = new URLSearchParams({ ...params, sign_token })
    const url = `http://gcaptcha4.geetest.com/validate?${queryParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  }
}

// ---------------------------------------------------------------------------
// Phone login better-auth plugin (factory — no DB dependency)
// ---------------------------------------------------------------------------
function createPhoneLoginPlugin(deps: PhoneAuthDeps) {
  return {
    id: 'phone-login',
    endpoints: {
      phoneLogin: createAuthEndpoint(
        '/phone-login',
        {
          method: 'POST',
          body: z.object({
            phoneNumber: z.string(),
            code: z.string(),
          }),
        },
        async (ctx) => {
          const { phoneNumber, code } = ctx.body

          const verification =
            await ctx.context.internalAdapter.findVerificationValue(phoneNumber)
          const verifyCode = verification?.value.split(':')[0]

          if (
            !verification ||
            new Date() > verification.expiresAt ||
            verifyCode !== code
          ) {
            return ctx.json(
              { data: null, error: 'Invalid or expired verification code' },
              { status: 400 }
            )
          }

          let user = await deps.findUserByPhone(phoneNumber)

          if (!user) {
            await ctx.context.internalAdapter.createUser({
              phoneNumber,
              phoneNumberVerified: true,
            } as any)

            user = await deps.findUserByPhone(phoneNumber)

            await ctx.context.internalAdapter.createAccount({
              userId: user!.id,
              accountId: phoneNumber,
              providerId: 'phone-number',
            })
          }

          const session = await ctx.context.internalAdapter.createSession(user!.id)
          await setSessionCookie(ctx, { session, user: user as any })
          await ctx.context.internalAdapter.deleteVerificationValue(verification.id)

          return ctx.json({ data: { user, session }, error: null })
        }
      ),
    },
  } satisfies BetterAuthPlugin
}

// ---------------------------------------------------------------------------
// Factory — caller provides DB deps
// ---------------------------------------------------------------------------
export function createPhoneAuthConfig(deps: PhoneAuthDeps): PhoneAuthConfig {
  return {
    smsProvider: new AliCloudSmsProvider(),
    captchaProvider: new GeetestCaptchaProvider(),
    phoneLoginPlugin: createPhoneLoginPlugin(deps),
  }
}
