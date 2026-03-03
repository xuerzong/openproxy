import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { CaptchaData } from '../types'

export interface CaptchaProps {
  onValidate: (captchaData: CaptchaData) => void
}

export const Captcha: React.FC<CaptchaProps> = ({ onValidate }) => {
  const { t } = useTranslation('common')
  const validate = () => {
    const result = (window as any).captchaObj.getValidate()
    if (!result) {
      alert(
        t('auth.completeCaptchaFirst', {
          defaultValue: 'Please complete captcha verification first!',
        })
      )
      return
    }
    onValidate(result)
  }
  useEffect(() => {
    const config = {
      captchaId: '03af081849f275d6bf71802f51654955',
      language: 'zho',
      product: 'bind',
      protocol: 'https://',
    }
    ;(window as any).initAlicom4(config, (captchaObj: any) => {
      ;(window as any).captchaObj = captchaObj
      captchaObj
        .appendTo('#captcha')
        .onReady(function () {
          ;(window as any).captchaObj?.showCaptcha?.()
        })
        .onNextReady(function () {})
        .onBoxShow(function () {
          console.log('boxShow')
        })
        .onError(function (e: any) {
          console.log(e)
        })
        .onSuccess(() => {
          if (config.product === 'bind') {
            validate()
          }
        })
    })
  }, [])
  return <div className="captcha" />
}
