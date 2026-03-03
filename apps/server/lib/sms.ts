import Dypnsapi, {
  CheckSmsVerifyCodeRequest,
  SendSmsVerifyCodeRequest,
} from '@alicloud/dypnsapi20170525'
import { Config } from '@alicloud/openapi-client'
import Credential from '@alicloud/credentials'
import { RuntimeOptions } from '@alicloud/tea-util'

// 1. Initialize Alibaba Cloud client (singleton pattern)
const createClient = () => {
  const CredentialCon = (Credential as any).default || Credential
  const DypnsapiCon: any = (Dypnsapi as any).default || Dypnsapi
  const config = new Config({
    credential: new CredentialCon(), // Auto-read environment variables
    endpoint: 'dypnsapi.aliyuncs.com',
  })
  return new DypnsapiCon(config)
}

const client = createClient()

export const sendSMS = async (phoneNumber: string, code: string) => {
  const request = new SendSmsVerifyCodeRequest({
    phoneNumber: phoneNumber,
    signName: '速通互联验证码',
    templateCode: '100001',
    templateParam: JSON.stringify({
      code: code,
      min: '5',
    }),
  })

  try {
    const response = await client.sendSmsVerifyCode(request)

    if (response.body?.code === 'OK') {
      return {
        success: true,
        message: 'Verification code sent successfully',
        requestId: response.body.requestId,
      }
    } else {
      return {
        success: false,
        code: response.body?.code,
        message: response.body?.message,
      }
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Internal Server Error',
    }
  }
}

export const checkSMS = async (phoneNumber: string, verifyCode: string) => {
  const request = new CheckSmsVerifyCodeRequest({
    phoneNumber: phoneNumber.replace(/^\+86/, ''), // Handle format from Better Auth
    verifyCode: verifyCode,
  })

  const runtime = new RuntimeOptions({})

  try {
    const response = await client.checkSmsVerifyCodeWithOptions(
      request,
      runtime
    )

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
