import { useNavigate, useSearchParams } from 'react-router'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoginButton } from './LoginButton'
import { LoginInput } from './LoginInput'
import { TermsAndPrivacy } from './TermsAndPrivacy'
import {
  EmailRegExp,
  PasswordRegExp,
  PhoneNumberRegExp,
} from '@/constants/regexp'
import { useTranslation } from 'react-i18next'
import { toastPromise } from '@/utils/toast'

export const PasswordLoginForm = () => {
  const { t } = useTranslation('common')
  const [submitLoading, setSubmitLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [formValues, setFormValues] = useState<{
    account: string
    password: string
  }>({
    account: '',
    password: '',
  })

  const [formErrors, setFormErrors] = useState<typeof formValues>({
    account: '',
    password: '',
  })

  const onChangeFormValues = (key: keyof typeof formValues, value: any) => {
    setFormValues((pre) => ({ ...pre, [key]: value }))
  }

  const onValidateFormValues = (values: typeof formValues) => {
    let success = true
    if (
      !PhoneNumberRegExp.test(values.account) &&
      !EmailRegExp.test(values.account)
    ) {
      success = false
      setFormErrors((pre) => ({
        ...pre,
        account: t('auth.invalidAccount'),
      }))
    } else {
      setFormErrors((pre) => ({ ...pre, account: '' }))
    }

    if (!PasswordRegExp.test(values.password)) {
      success = false
      setFormErrors((pre) => ({
        ...pre,
        password: t('auth.invalidPassword'),
      }))
    } else {
      setFormErrors((pre) => ({ ...pre, password: '' }))
    }

    return success
  }

  const onFinish = async (values: any) => {
    if (PhoneNumberRegExp.test(values.account)) {
      return
    }

    setSubmitLoading(true)

    void toastPromise(
      signIn(values.account, values.password).then((success) => {
        if (!success) {
          throw new Error(t('auth.loginFailed'))
        }

        return success
      }),
      {
        loading: t('common.processing'),
        success: t('auth.loginSuccess'),
        error: (error) =>
          error instanceof Error ? error.message : t('auth.loginFailed'),
        onSuccess: () => {
          navigate(redirect, { replace: true })
        },
      }
    ).finally(() => {
      setSubmitLoading(false)
    })
  }
  return (
    <div className="gap-2">
      <div className="w-full">
        <div className="relative mb-6">
          <LoginInput
            value={formValues.account}
            onChange={(e) => {
              onChangeFormValues('account', e.target.value)
            }}
            name="account"
            placeholder={t('auth.accountPlaceholder')}
            isError={!!formErrors.account}
          />
          {formErrors.account && (
            <span className="absolute left-0 -bottom-1 transform translate-y-full text-xs text-danger">
              {formErrors.account}
            </span>
          )}
        </div>
        <div className="relative mb-6">
          <LoginInput
            name="password"
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={formValues.password}
            onChange={(e) => {
              onChangeFormValues('password', e.target.value)
            }}
            isError={!!formErrors.password}
          />
          {formErrors.password && (
            <span className="absolute left-0 -bottom-1 transform translate-y-full text-xs text-danger">
              {formErrors.password}
            </span>
          )}
        </div>
      </div>

      <TermsAndPrivacy />

      <LoginButton
        onClick={() => {
          const success = onValidateFormValues(formValues)
          if (!success) {
            return
          }
          onFinish(formValues)
        }}
        disabled={submitLoading}
      />
    </div>
  )
}
