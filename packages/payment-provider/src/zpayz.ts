/**
 * ⚠️  This file contains proprietary payment-provider credentials and logic.
 *    Keep this package out of any public repository.
 */

import type {
  CreateQrCodeUrlParams,
  NotifyParams,
  PaymentProvider,
} from './types'

// ---------------------------------------------------------------------------
// Provider credentials
// ---------------------------------------------------------------------------
export interface ZpayzConfig {
  cid: string
  pid: string
  payKey: string
  gateway: string
}

// ---------------------------------------------------------------------------
// Signature helper
// ---------------------------------------------------------------------------
function generateSign(
  params: Record<string, string | number>,
  key: string
): string {
  const prestr = Object.keys(params)
    .filter(
      (k) =>
        params[k] !== '' &&
        params[k] !== null &&
        k !== 'sign' &&
        k !== 'sign_type'
    )
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  const hasher = new Bun.CryptoHasher('md5')
  hasher.update(prestr + key)
  return hasher.digest('hex')
}

// ---------------------------------------------------------------------------
// Concrete implementation
// ---------------------------------------------------------------------------
export class ZpayzPaymentProvider implements PaymentProvider {
  private readonly cid: string
  private readonly pid: string
  private readonly payKey: string
  private readonly gateway: string

  constructor(config: ZpayzConfig) {
    this.cid = config.cid
    this.pid = config.pid
    this.payKey = config.payKey
    this.gateway = config.gateway
  }

  createQrCodeUrl(params: CreateQrCodeUrlParams): string {
    const data: Record<string, string> = {
      name: '充值金额',
      money: params.amount,
      type: params.type,
      out_trade_no: params.orderId,
      notify_url: params.notifyUrl,
      return_url: params.returnUrl,
      pid: this.pid,
      cid: this.cid,
    }

    const search = new URLSearchParams({
      ...data,
      sign: generateSign(data, this.payKey),
      sign_type: 'MD5',
    }).toString()

    return `${this.gateway}?${search}`
  }

  verifyNotify(params: NotifyParams): boolean {
    const { sign, sign_type, ...rest } = params
    const cleaned = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined && v !== '')
    ) as Record<string, string | number>

    return generateSign(cleaned, this.payKey) === sign
  }
}
