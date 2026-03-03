import { BillingForm } from '@/components/BillingForm'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  return (
    <PageContainer
      title={t('billing.title', { defaultValue: 'Billing' })}
      className="h-screen"
    >
      <BillingForm />
    </PageContainer>
  )
}

export default Page
