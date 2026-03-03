import { ModelTable } from '@/components/Model/ModelTable'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  return (
    <PageContainer
      title={t('models.title', { defaultValue: 'Models' })}
      className="h-screen"
    >
      <ModelTable />
    </PageContainer>
  )
}

export default Page
