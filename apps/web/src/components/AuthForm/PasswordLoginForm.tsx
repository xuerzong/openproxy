import { useNavigate } from 'react-router'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { LoginButton } from './LoginButton'
import { LoginInput } from './LoginInput'
import { TermsAndPrivacy } from './TermsAndPrivacy'
import {
  EmailRegExp,
  PasswordRegExp,
  PhoneNumberRegExp,
} from '@/constants/regexp'
import { useTranslation } from 'react-i18next'

export const PasswordLoginForm = () => {
  const { t } = useTranslation('common')
  const [submitLoading, setSubmitLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

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
        account: t('auth.invalidAccount', { defaultValue: 'Invalid account' }),
      }))
    } else {
      setFormErrors((pre) => ({ ...pre, account: '' }))
    }

    if (!PasswordRegExp.test(values.password)) {
      success = false
      setFormErrors((pre) => ({
        ...pre,
        password: t('auth.invalidPassword', {
          defaultValue: 'Invalid password',
        }),
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

    const success = await signIn(values.account, values.password)

    setSubmitLoading(false)
    if (!success) {
      toast.error(
        t('auth.passwordOrEmailWrong', {
          defaultValue: 'Incorrect password or email',
        })
      )
      return
    }

    toast.success(t('auth.loginSuccess', { defaultValue: 'Login successful' }))
    navigate('/')
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
            placeholder={t('auth.accountPlaceholder', {
              defaultValue: 'Please input phone or email',
            })}
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
            placeholder={t('auth.passwordPlaceholder', {
              defaultValue: 'Please input password',
            })}
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
