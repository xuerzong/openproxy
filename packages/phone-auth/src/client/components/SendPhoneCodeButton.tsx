import { useEffect, useRef, useState } from 'react'
import { useCountDown } from 'ahooks'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'
import { PhoneNumberRegExp } from '../constants'
import { CaptchaTrigger } from './CaptchaTrigger'
import type { CaptchaData } from '../types'

const useSendSMSCountDown = () => {
  const targetDateCache = Number(localStorage.getItem('sendSMSCountDown'))
  const [targetDate, setTargetDate] = useState<number>(
    isNaN(targetDateCache) || targetDateCache <= 0 ? 0 : targetDateCache
  )
  const [countdown] = useCountDown({
    targetDate,
  })

  const start = () => {
    const duration = 60_000
    setTargetDate(Date.now() + duration)
    localStorage.setItem('sendSMSCountDown', (Date.now() + duration).toString())
  }

  return { start, value: countdown }
}

interface SendPhoneCodeButtonProps {
  phoneNumber?: string
  sendOtp: (phoneNumber: string, captchaData: CaptchaData) => Promise<void>
}

export const SendPhoneCodeButton: React.FC<SendPhoneCodeButtonProps> = ({
  phoneNumber,
  sendOtp,
}) => {
  const { t } = useTranslation('common')
  const sendSMSCountDown = useSendSMSCountDown()
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const phoneNumberCacheRef = useRef(phoneNumber)
  useEffect(() => {
    phoneNumberCacheRef.current = phoneNumber
  }, [phoneNumber])
  return (
    <>
      <CaptchaTrigger
        onValidate={(captchaData) => {
          const phoneNumber = phoneNumberCacheRef.current
          if (!phoneNumber) {
            return
          }
          setSendCodeLoading(true)
          sendOtp(phoneNumber, captchaData)
            .then(() => {
              sendSMSCountDown.start()
            })
            .finally(() => {
              setSendCodeLoading(false)
            })
        }}
        onBeforeClick={() => {
          if (sendCodeLoading) {
            return
          }
          if (
            !phoneNumberCacheRef.current ||
            !PhoneNumberRegExp.test(phoneNumberCacheRef.current)
          ) {
            toast.warning(t('auth.fillValidPhoneFirst'))
            return
          }
          if (sendSMSCountDown.value > 0) {
            return
          }
          return true
        }}
      >
        <div
          className={cn(
            'relative text-blue-600 hover:text-blue-600/75 select-none cursor-pointer',
            {
              'text-foreground/50 hover:text-foreground/50 cursor-not-allowed':
                sendSMSCountDown.value > 0,
            }
          )}
        >
          {sendCodeLoading && (
            <div className="absolute top-1/2 left-1/2 translate-[-50%]">
              <Loader2Icon className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div className={cn(sendCodeLoading && 'opacity-50')}>
            {sendSMSCountDown.value > 0
              ? t('auth.retryAfterSeconds', {
                  seconds: Math.round(sendSMSCountDown.value / 1000),
                })
              : t('auth.sendCode')}
          </div>
        </div>
      </CaptchaTrigger>
    </>
  )
}
