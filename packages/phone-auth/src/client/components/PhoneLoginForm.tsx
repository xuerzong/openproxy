import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PhoneNumberRegExp } from '../constants'
import { SendPhoneCodeButton } from './SendPhoneCodeButton'
import type { PhoneLoginFormProps } from '../types'
import { LoginInput } from './LoginInput'
import { LoginButton } from './LoginButton'

export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({
  sendOtp,
  login,
  onSuccess,
  footer,
}) => {
  const { t } = useTranslation('common')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formValues, setFormValues] = useState<{
    phoneNumber: string
    code: string
  }>({
    phoneNumber: '',
    code: '',
  })

  const [formErrors, setFormErrors] = useState<{
    phoneNumber: string
    code: string
  }>({
    phoneNumber: '',
    code: '',
  })

  const onChangeFormValues = (key: keyof typeof formValues, value: any) => {
    setFormValues((pre) => ({ ...pre, [key]: value }))
  }

  const onValidateFormValues = (values: typeof formValues) => {
    let success = true
    if (!PhoneNumberRegExp.test(values.phoneNumber)) {
      success = false
      setFormErrors((pre) => ({
        ...pre,
        phoneNumber: t('auth.invalidPhone', {
          defaultValue: 'Invalid phone number',
        }),
      }))
    } else {
      setFormErrors((pre) => ({ ...pre, phoneNumber: '' }))
    }

    if (!/^\d{6}$/.test(values.code)) {
      success = false
      setFormErrors((pre) => ({
        ...pre,
        code: t('auth.invalidCode', {
          defaultValue: 'Invalid verification code',
        }),
      }))
    } else {
      setFormErrors((pre) => ({ ...pre, code: '' }))
    }

    return success
  }

  return (
    <div className="gap-2">
      <div className="w-full">
        <div className="relative mb-6">
          <div className="relative flex items-center w-full">
            <span className="absolute left-4 top-[50%] translate-y-[-50%]">
              +86
            </span>
            <LoginInput
              className="pl-12"
              isError={!!formErrors.phoneNumber}
              placeholder={t('auth.phonePlaceholder', {
                defaultValue: 'Please input phone number',
              })}
              value={formValues.phoneNumber}
              onChange={(e) => {
                onChangeFormValues('phoneNumber', e.target.value)
              }}
            />
          </div>
          {formErrors.phoneNumber && (
            <span className="absolute left-0 -bottom-1 transform translate-y-full text-xs text-danger">
              {formErrors.phoneNumber}
            </span>
          )}
        </div>
        <div className="relative mb-6">
          <div className="relative flex items-center w-full">
            <LoginInput
              className="pr-[50%]"
              isError={!!formErrors.code}
              placeholder={t('auth.codePlaceholder', {
                defaultValue: 'Please input verification code',
              })}
              value={formValues.code}
              onChange={(e) => {
                onChangeFormValues('code', e.target.value)
              }}
            />
            <div className="absolute right-4 top-[50%] translate-y-[-50%] z-10">
              <SendPhoneCodeButton
                phoneNumber={formValues.phoneNumber}
                sendOtp={sendOtp}
              />
            </div>
          </div>

          {formErrors.code && (
            <span className="absolute left-0 -bottom-1 transform translate-y-full text-xs text-danger">
              {formErrors.code}
            </span>
          )}
        </div>
      </div>

      {footer}

      <div className="w-full">
        <LoginButton
          onClick={async () => {
            const success = onValidateFormValues(formValues)
            if (!success) {
              return
            }

            try {
              setSubmitLoading(true)
              const { error } = await login(
                formValues.phoneNumber,
                formValues.code
              )

              if (error) {
                toast.error(
                  t('common.operationFailedWithMessage', {
                    defaultValue: `Operation failed: ${error}`,
                    message: error,
                  })
                )
                return
              }
              onSuccess()
              toast.success(
                t('common.operationSuccess', { defaultValue: 'Success' })
              )
            } catch {
              toast.error(
                t('common.operationFailed', {
                  defaultValue: 'Operation failed',
                })
              )
            } finally {
              setSubmitLoading(false)
            }
          }}
          disabled={submitLoading}
        />
      </div>
    </div>
  )
}
