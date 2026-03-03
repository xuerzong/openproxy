import type { PhoneLoginFormProps, CaptchaData } from './types'

/**
 * Stub PhoneLoginForm — renders nothing.
 * Replace with a real implementation (e.g., ./alicloud) for production use.
 */
export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = () => {
  return null
}

/**
 * Stub CaptchaTrigger — renders children directly without captcha.
 */
export const CaptchaTrigger: React.FC<
  React.PropsWithChildren<{
    onValidate: (captchaData: CaptchaData) => void
    onBeforeClick?: () => boolean | void
  }>
> = ({ children }) => {
  return <>{children}</>
}

export type { PhoneLoginFormProps, CaptchaData }
