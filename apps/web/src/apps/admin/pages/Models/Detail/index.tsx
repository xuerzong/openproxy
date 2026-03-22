import { useParams } from 'react-router'
import { ModelEditor } from '@/components/Model/ModelEditor'
import { NotFoundView } from '@/components/NotFoundView'
import { PageContainer } from '@/components/PageContainer'
import { Loader } from '@openproxy/ui/Loader'
import { useModelQuery } from '@/hooks/queries/useModelQuery'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const params = useParams()
  const modelId = params['*'] || ''
  const { data: model, isLoading, refetch } = useModelQuery(modelId)

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-primary">
        <Loader />
      </div>
    )
  }

  if (!model) {
    return <NotFoundView />
  }

  return (
    <PageContainer
      title={t('models.detailTitle', {
        defaultValue: `Model Detail - ${modelId}`,
        id: modelId,
      })}
    >
      <ModelEditor
        defaultValues={model}
        isEdit
        onRefresh={() => refetch()}
      />
    </PageContainer>
  )
}

export default Page
