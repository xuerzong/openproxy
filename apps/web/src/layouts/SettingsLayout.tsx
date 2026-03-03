import { PageContainer } from '@/components/PageContainer'
import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

export const SettingsLayout = () => {
  const { t } = useTranslation('common')
  return (
    <PageContainer title={t('settings.title', { defaultValue: 'Settings' })}>
      <Outlet />
    </PageContainer>
  )
}

export default SettingsLayout
