import React, { useEffect, useRef, useState } from 'react'
import { Captcha } from './Captcha'
import { Portal, Slot } from 'radix-ui'
import { loadCt4 } from '../utils/ct4'
import type { CaptchaData } from '../types'

interface CaptchaTriggerProps {
  onValidate: (captchaData: CaptchaData) => void
  onBeforeClick?: () => boolean | void
}

export const CaptchaTrigger: React.FC<
  React.PropsWithChildren<CaptchaTriggerProps>
> = ({ children, onBeforeClick, onValidate }) => {
  const [captchaLoading, setCaptchaLoading] = useState(true)
  const captchaIntervalerRef = useRef(0)

  useEffect(() => {
    return () => {
      window.clearInterval(captchaIntervalerRef.current)
    }
  }, [])

  return (
    <>
      <Slot.Root
        onClick={async () => {
          const shouldContinue = onBeforeClick?.()
          if (!shouldContinue) return

          setCaptchaLoading(true)

          if ((typeof window as any).captchaObj?.showCaptcha === 'function') {
            return (typeof window as any).captchaObj?.showCaptcha?.()
          }

          await loadCt4()
          captchaIntervalerRef.current = window.setInterval(() => {
            if (typeof (window as any).initAlicom4 !== 'undefined') {
              setCaptchaLoading(false)
              window.clearInterval(captchaIntervalerRef.current)
            }
          }, 200)
        }}
      >
        {children}
      </Slot.Root>
      {!captchaLoading && (
        <Portal.Portal>
          <Captcha onValidate={onValidate} />
        </Portal.Portal>
      )}
    </>
  )
}
