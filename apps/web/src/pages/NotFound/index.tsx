import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

const NotFound = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <img style={{ width: 200 }} src="/404.svg" />
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 0 }}>
        {t('notFound.title', { defaultValue: '404: Page not found' })}
      </h2>
      <p>
        {t('notFound.description', {
          defaultValue:
            'Sorry, we searched everywhere but could not find the page you requested.',
        })}
      </p>
      <Button
        onClick={() => {
          navigate('/', { replace: true })
        }}
      >
        {t('notFound.backToDashboard', { defaultValue: 'Back to dashboard' })}
      </Button>
    </div>
  )
}

export default NotFound
