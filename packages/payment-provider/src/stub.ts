import type { CreateQrCodeUrlParams, NotifyParams, PaymentProvider } from './types'

/**
 * No-op stub used in open-source builds.
 * Replace this by providing a real PaymentProvider implementation and
 * updating packages/payment-provider/src/index.ts accordingly.
 */
export class NoOpPaymentProvider implements PaymentProvider {
  createQrCodeUrl(_params: CreateQrCodeUrlParams): string {
    throw new Error(
      '[payment-provider] No provider configured. ' +
        'Implement PaymentProvider and register it in packages/payment-provider/src/index.ts.'
    )
  }

  verifyNotify(_params: NotifyParams): boolean {
    return false
  }
}

export const paymentProvider = new NoOpPaymentProvider()
