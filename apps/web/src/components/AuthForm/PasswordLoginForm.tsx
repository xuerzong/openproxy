import { useNavigate, useSearchParams } from 'react-router'
import { useState } from 'react'
import { Form, FormField, useForm } from '@openproxy/ui/Form'
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
  const [form] = useForm({
    defaultValues: {
      account: '',
      password: '',
    },
    validators: {
      account: async (account) => {
        if (EmailRegExp.test(account) || PhoneNumberRegExp.test(account)) {
          return { success: true }
        }
        return {
          success: false,
          message: t('auth.invalidAccount'),
        }
      },
      password: async (password) => {
        if (PasswordRegExp.test(password)) {
          return { success: true }
        }
        return {
          success: false,
          message: t('auth.invalidPassword'),
        }
      },
    },
  })

  const onFinish = async (values: any) => {
    setSubmitLoading(true)

    toastPromise(
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

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    form.onSubmit(async (values) => {
      await onFinish(values)
    })
  }

  return (
    <div className="gap-2">
      <Form form={form} className="w-full" onSubmit={onSubmit}>
        <FormField
          name="account"
          label={
            <span className="sr-only">{t('auth.accountPlaceholder')}</span>
          }
        >
          <LoginInput
            name="account"
            placeholder={t('auth.accountPlaceholder')}
            isError={!!form.getFieldError('account')}
          />
        </FormField>

        <FormField
          name="password"
          label={
            <span className="sr-only">{t('auth.passwordPlaceholder')}</span>
          }
        >
          <LoginInput
            name="password"
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            isError={!!form.getFieldError('password')}
          />
        </FormField>

        <TermsAndPrivacy />

        <LoginButton type="submit" disabled={submitLoading} />
      </Form>
    </div>
  )
}
