import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import { ModelEditor } from '@/components/Model/ModelEditor'
import { NotFoundView } from '@/components/NotFoundView'
import { PageContainer } from '@/components/PageContainer'
import { Loader } from '@openproxy/ui/Loader'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const params = useParams()
  const request = useRequest()
  const [model, setModel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const modelId = params['*'] || ''

  const fetchModel = async (refresh = false) => {
    setLoading(!refresh)
    await request.models
      .get({ query: { id: modelId } })
      .then((res) => {
        if (res.error) {
          toast.error(
            t('common.operationFailedWithStatus', {
              defaultValue: `Operation failed: ${res.error.status}`,
              status: res.error.status,
            })
          )
          setModel(null)
          return
        }
        setModel(res.data || null)
      })
      .finally(() => {
        setLoading(false)
      })
  }
  useEffect(() => {
    fetchModel()
  }, [])

  if (loading) {
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
      className="h-screen"
    >
      <ModelEditor
        defaultValues={model}
        isEdit
        onRefresh={() => fetchModel(true)}
      />
    </PageContainer>
  )
}

export default Page
