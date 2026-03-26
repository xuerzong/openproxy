import { ModelEditor } from '@/components/Model/ModelEditor'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useMemo } from 'react'

interface CreateModelLocationState {
  defaultValues?: Record<string, any>
}

const Page = () => {
  const { t } = useTranslation('common')
  const location = useLocation()
  const duplicatedModelInitialValues = useMemo(() => {
    const state = location.state as CreateModelLocationState | null
    return state?.defaultValues ?? {}
  }, [location.state])

  const title = Object.keys(duplicatedModelInitialValues).length
    ? t('models.copyCreateTitle', { defaultValue: 'Create Model From Copy' })
    : t('models.createTitle', { defaultValue: 'Create Model' })

  return (
    <PageContainer title={title}>
      <ModelEditor defaultValues={duplicatedModelInitialValues} />
    </PageContainer>
  )
}

export default Page
