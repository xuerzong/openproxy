import { useNavigate, useParams } from 'react-router'
import { ModelEditor } from '@/components/Model/ModelEditor'
import { NotFoundView } from '@/components/NotFoundView'
import { PageContainer } from '@/components/PageContainer'
import { Loader } from '@openproxy/ui/Loader'
import { Select } from '@openproxy/ui/Select'
import { Button } from '@openproxy/ui/Button'
import { ModelIcon } from '@/components/ModelIcon'
import { useModelQuery } from '@/apps/admin/hooks/queries/useModelQuery'
import { useModelsQuery } from '@/hooks/queries/useModelsQuery'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { CopyIcon } from 'lucide-react'
import { getDuplicatedModelInitialValues } from '@/components/Model/getDuplicatedModelInitialValues'

const Page = () => {
  const { t } = useTranslation('common')
  const params = useParams()
  const navigate = useNavigate()
  const modelId = params['*'] || ''
  const { data: model, isLoading, refetch } = useModelQuery(modelId)
  const { data: models } = useModelsQuery()

  const modelOptions = useMemo(
    () =>
      (models ?? []).map((m) => ({
        value: m.id,
        label: m.name || m.id,
        icon: <ModelIcon model={m.ownedBy} className="w-4 h-4" />,
      })),
    [models]
  )

  const duplicatedModelInitialValues = useMemo(
    () => getDuplicatedModelInitialValues(model),
    [model]
  )

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
      title={
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>
            {t('models.detailTitle', { defaultValue: 'Model Detail' })}
          </span>
          <Select
            options={modelOptions}
            value={modelId}
            onChange={(value) => navigate(`/models/${value}`)}
            triggerClassName="min-w-32 font-normal"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigate('/models/new', {
                state: { defaultValues: duplicatedModelInitialValues },
              })
            }}
          >
            <CopyIcon className="w-4 h-4" />
            {t('models.copyCreateAction', {
              defaultValue: 'Copy As New',
            })}
          </Button>
        </div>
      }
    >
      <ModelEditor defaultValues={model} isEdit onRefresh={() => refetch()} />
    </PageContainer>
  )
}

export default Page
