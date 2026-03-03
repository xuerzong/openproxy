import { Card } from '@/components/Card'
import { PageContainer } from '@/components/PageContainer'
import { Statistic } from '@/components/ui/Statistic'
import { useAdminDashboardStatsQuery } from '@/apps/admin/hooks/queries/useAdminDashboardStatsQuery'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const statsQuery = useAdminDashboardStatsQuery()
  const stats = statsQuery.data

  const formatNumber = (value?: number) => Number(value || 0).toLocaleString()

  return (
    <PageContainer
      title={t('dashboard.title', { defaultValue: 'Dashboard' })}
      className="h-screen"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title={t('adminDashboard.users.total', {
              defaultValue: 'Total Users',
            })}
            value={formatNumber(stats?.users.total)}
          />
        </Card>

        <Card>
          <Statistic
            title={t('adminDashboard.users.todayNew', {
              defaultValue: 'New Users Today',
            })}
            value={formatNumber(stats?.users.todayNew)}
          />
        </Card>

        <Card>
          <Statistic
            title={t('adminDashboard.recharge.todayAmount', {
              defaultValue: 'Recharge Today (CNY)',
            })}
            value={Number(stats?.recharge.todayAmount || 0).toFixed(2)}
          />
        </Card>

        <Card>
          <Statistic
            title={t('adminDashboard.usage.rpm', {
              defaultValue: 'RPM (Last 1m)',
            })}
            value={formatNumber(stats?.usage.rpm)}
          />
        </Card>

        <Card>
          <Statistic
            title={t('adminDashboard.usage.tpm', {
              defaultValue: 'TPM (Last 1m)',
            })}
            value={formatNumber(stats?.usage.tpm)}
          />
        </Card>
      </div>
    </PageContainer>
  )
}

export default Page
