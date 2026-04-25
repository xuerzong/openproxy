import { PageContainer } from '@/components/PageContainer'
import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

export const TeamSettingsLayout = () => {
  const { t } = useTranslation('common')

  return (
    <PageContainer
      title={t('teamSettings.title', { defaultValue: 'Team Settings' })}
    >
      <Outlet />
    </PageContainer>
  )
}

export default TeamSettingsLayout
