import { useTranslation } from 'react-i18next'

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://aiproxy.shop'

export const TermsAndPrivacy = () => {
  const { t } = useTranslation('common')
  return (
    <div className="text-sm">
      {t('auth.termsPrefix', {
        defaultValue: 'By signing up or logging in, you agree to our',
      })}
      <a
        className="text-blue-600 mx-1 underline"
        href={`${SITE_URL}/terms`}
      >
        {t('auth.termsOfService', { defaultValue: 'Terms of Service' })}
      </a>
      {t('common.and', { defaultValue: 'and' })}
      <a
        className="text-blue-600 mx-1 underline"
        href={`${SITE_URL}/privacy`}
      >
        {t('auth.privacyPolicy', { defaultValue: 'Privacy Policy' })}
      </a>
      {t('auth.termsSuffix', {
        defaultValue:
          '. Unregistered phone numbers will be signed up automatically.',
      })}
    </div>
  )
}
