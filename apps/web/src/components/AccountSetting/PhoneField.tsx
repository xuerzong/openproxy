import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useState } from 'react'
import { authClient } from '@/utils/better-auth'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'
import { Dialog } from '@openproxy/ui/Dialog'
import { useCountdown } from '@/hooks/useCountDown'
import { toast } from 'sonner'
import { CaptchaTrigger } from '@openproxy/phone-auth/client'
import { PhoneNumberRegExp } from '@openproxy/phone-auth/client/constants'
import type { CaptchaData } from '@openproxy/phone-auth/client'

export const PhoneField = () => {
  const { t } = useTranslation('common')
  const { session, refreshSession } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasPhone = Boolean(session?.user.phoneNumber)
  const phoneLabel = hasPhone
    ? t('account.changePhone', { defaultValue: 'Change Phone' })
    : t('account.bindPhone', { defaultValue: 'Bind Phone' })
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const {
    timeLeft,
    start: startCountdown,
    isCounting,
  } = useCountdown({
    key: 'change-phone-countdown',
    seconds: 60,
  })

  const handleSendCode = async (captchaData: CaptchaData) => {
    if (!newPhone.trim() || isCounting) return
    setCodeSending(true)
    try {
      const res = await authClient.phoneNumber.sendOtp({
        phoneNumber: newPhone,
        fetchOptions: {
          body: { captchaData },
        },
      })
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      startCountdown()
    } finally {
      setCodeSending(false)
    }
  }

  const handleVerifyAndUpdate = async () => {
    if (!newPhone.trim() || !code.trim()) return
    setLoading(true)
    try {
      const res = await authClient.phoneNumber.verify({
        phoneNumber: newPhone,
        code,
        updatePhoneNumber: true,
      })
      if (res.error) {
        throw new Error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${res.error.status}`,
            status: res.error.status,
          })
        )
      }
      await refreshSession()
      setDialogOpen(false)
      setNewPhone('')
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="font-medium text-sm" htmlFor="phone">
          {t('account.phone', { defaultValue: 'Phone Number' })}
        </label>
        <div className="flex items-center gap-4">
          <Input
            className="flex-1"
            name="phone"
            value={session?.user.phoneNumber || '-'}
            disabled
          />
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {phoneLabel}
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={phoneLabel}
        width={420}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              disabled={!newPhone.trim() || !code.trim() || loading}
              onClick={() => {
                void toastPromise(handleVerifyAndUpdate(), {
                  loading: t('common.processing', {
                    defaultValue: 'Processing...',
                  }),
                  success: t('account.changePhoneSuccess', {
                    defaultValue: 'Phone number updated successfully',
                  }),
                  error: (error) =>
                    error instanceof Error
                      ? error.message
                      : t('common.operationFailed', {
                          defaultValue: 'Operation failed',
                        }),
                })
              }}
            >
              {t('account.verifyAndUpdate', {
                defaultValue: 'Verify & Update',
              })}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">
              {t('account.newPhone', { defaultValue: 'New Phone Number' })}
            </label>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder={t('auth.phonePlaceholder', {
                defaultValue: 'Please input phone number',
              })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm">
              {t('account.verificationCode', {
                defaultValue: 'Verification Code',
              })}
            </label>
            <div className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('auth.codePlaceholder', {
                  defaultValue: 'Please input verification code',
                })}
              />
              <CaptchaTrigger
                onBeforeClick={() => {
                  if (codeSending || isCounting) return
                  if (!newPhone.trim() || !PhoneNumberRegExp.test(newPhone)) {
                    toast.warning(t('auth.fillValidPhoneFirst'))
                    return
                  }
                  return true
                }}
                onValidate={(captchaData) => {
                  void toastPromise(handleSendCode(captchaData), {
                    loading: t('common.processing', {
                      defaultValue: 'Processing...',
                    }),
                    success: t('common.operationSuccess', {
                      defaultValue: 'Success',
                    }),
                    error: (error) =>
                      error instanceof Error
                        ? error.message
                        : t('common.operationFailed', {
                            defaultValue: 'Operation failed',
                          }),
                  })
                }}
              >
                <Button
                  variant="outline"
                  disabled={!newPhone.trim() || isCounting || codeSending}
                >
                  {isCounting
                    ? t('auth.retryAfterSeconds', {
                        defaultValue: `${timeLeft}s to retry`,
                        seconds: timeLeft,
                      })
                    : t('account.sendCode', { defaultValue: 'Send Code' })}
                </Button>
              </CaptchaTrigger>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
