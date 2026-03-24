import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PhoneLoginForm } from '@openproxy/phone-auth/client'
import { LockIcon, SmartphoneIcon } from 'lucide-react'
import { cn } from '@openproxy/ui/utils/cn'
import { Tooltip } from '@openproxy/ui/Tooltip'
import { PasswordLoginForm } from '@/components/AuthForm/PasswordLoginForm'
import { TermsAndPrivacy } from '@/components/AuthForm/TermsAndPrivacy'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { authClient } from '@/utils/better-auth'
import { useIsOSS } from '@/hooks/useIsOSS'
import { useTranslation } from 'react-i18next'
import { GithubIcon } from '@/components/GithubIcon'
import { GoogleIcon } from '@/components/GoogleIcon'
import { useLoginMethodsQuery } from '@/hooks/queries/useLoginMethodsQuery'
import s from './index.module.css'

const Page = () => {
  const { t } = useTranslation('common')
  const { refreshSession } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isOSS = useIsOSS()
  const showPhoneLogin = !isOSS
  const redirect = searchParams.get('redirect') || '/'
  const [loginMethod, setLoginMethod] = useState<'phone' | 'password'>(
    showPhoneLogin ? 'phone' : 'password'
  )
  const { data: loginMethods } = useLoginMethodsQuery()

  const signInWithSocial = (provider: 'github' | 'google') => {
    authClient.signIn.social({ provider, callbackURL: redirect })
  }

  return (
    <div className="w-96 p-4">
      <div className="flex flex-col items-center justify-center mb-8">
        <Logo className="h-12 w-auto" />
        <span className="text-xs text-primary font-bold">
          {loginMethod === 'phone' && showPhoneLogin && t('auth.phoneLogin')}
          {loginMethod === 'password' && t('auth.passwordLogin')}
        </span>
      </div>

      {loginMethod === 'phone' && showPhoneLogin && (
        <PhoneLoginForm
          sendOtp={async (phoneNumber, captchaData) => {
            await authClient.phoneNumber.sendOtp({
              phoneNumber,
              fetchOptions: {
                body: { captchaData },
              },
            })
          }}
          login={async (phoneNumber, code) => {
            const res = await fetch('/api/auth/phone-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber, code }),
            })
            return res.json()
          }}
          onSuccess={async () => {
            await refreshSession()
            navigate(redirect, { replace: true })
          }}
          footer={<TermsAndPrivacy />}
        />
      )}

      {loginMethod === 'password' && <PasswordLoginForm />}

      <div
        className={cn(
          s.LoginMethods,
          'w-full flex items-center justify-center gap-2 mt-6'
        )}
      >
        {loginMethod === 'phone' && showPhoneLogin && (
          <Tooltip content={t('auth.passwordLogin')}>
            <button
              className={cn(
                'h-12 w-12 flex items-center justify-center border border-border rounded-full cursor-pointer',
                'hover:bg-muted'
              )}
              onClick={() => {
                setLoginMethod('password')
              }}
            >
              <LockIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        )}

        {loginMethod === 'password' && showPhoneLogin && (
          <Tooltip content={t('auth.phoneLogin')}>
            <button
              className={cn(
                'h-12 w-12 flex items-center justify-center border border-border rounded-full cursor-pointer',
                'hover:bg-muted'
              )}
              onClick={() => {
                setLoginMethod('phone')
              }}
            >
              <SmartphoneIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        )}

        {loginMethods?.github && (
          <Tooltip content={t('auth.githubLogin')}>
            <button
              className={cn(
                'h-12 w-12 flex items-center justify-center border border-border rounded-full cursor-pointer',
                'hover:bg-muted'
              )}
              onClick={() => signInWithSocial('github')}
            >
              <GithubIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        )}

        {loginMethods?.google && (
          <Tooltip content={t('auth.googleLogin')}>
            <button
              className={cn(
                'h-12 w-12 flex items-center justify-center border border-border rounded-full cursor-pointer',
                'hover:bg-muted'
              )}
              onClick={() => signInWithSocial('google')}
            >
              <GoogleIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export default Page
