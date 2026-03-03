import { ModelEditor } from '@/components/Model/ModelEditor'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  return (
    <PageContainer
      title={t('models.createTitle', { defaultValue: 'Create Model' })}
    >
      <ModelEditor defaultValues={{}} />
    </PageContainer>
  )
}

export default Page
