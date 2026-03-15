import { useMemo } from 'react'
import { Card } from '@/components/Card'
import { PageContainer } from '@/components/PageContainer'
import { useAdminDashboardUsagesByModelGroupQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesByModelGroupQuery'
import { useAdminDashboardUsagesByProviderQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesByProviderQuery'
import { useAdminDashboardUsagesGroupedQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesGroupedQuery'
import { Statistic } from '@/components/ui/Statistic'
import { useAdminDashboardStatsQuery } from '@/apps/admin/hooks/queries/useAdminDashboardStatsQuery'
import dayjs from '@/utils/dayjs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/Chart'
import type { ChartConfig } from '@/components/ui/Chart'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'

const MODEL_GROUP_COLORS = [
  '#2563eb',
  '#16a34a',
  '#ea580c',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#ca8a04',
  '#4f46e5',
  '#db2777',
  '#059669',
  '#6d28d9',
]

const formatModelGroupLabel = (value: string) =>
  value
    .split('-')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')

const Page = () => {
  const { t } = useTranslation('common')
  const statsQuery = useAdminDashboardStatsQuery()
  const usageGroupedQuery = useAdminDashboardUsagesGroupedQuery({
    rangeHours: 24,
    bucketHours: 2,
  })
  const usageByModelGroupQuery = useAdminDashboardUsagesByModelGroupQuery({
    rangeHours: 24,
  })
  const usageByProviderQuery = useAdminDashboardUsagesByProviderQuery({
    rangeHours: 24,
  })
  const stats = statsQuery.data

  const formatNumber = (value?: number) => Number(value || 0).toLocaleString()

  const chartData = useMemo(() => {
    return (usageGroupedQuery.data || []).map((item) => ({
      bucketLabel: dayjs(item.bucketAt).format('MM/DD HH:mm'),
      totalTokens: item.tokensPrompt + item.tokensCompletion,
    }))
  }, [usageGroupedQuery.data])

  const requestsByModelGroupData = useMemo(() => {
    return (usageByModelGroupQuery.data || []).map((item, index) => ({
      modelGroup: item.modelGroup || 'other',
      requests: Number(item.requests || 0),
      fill: MODEL_GROUP_COLORS[index % MODEL_GROUP_COLORS.length],
    }))
  }, [usageByModelGroupQuery.data])

  const requestsByProviderData = useMemo(() => {
    return (usageByProviderQuery.data || []).map((item, index) => ({
      providerId: item.providerId || `provider-${index}`,
      providerName: item.providerName || 'Unknown',
      requests: Number(item.requests || 0),
      fill: MODEL_GROUP_COLORS[index % MODEL_GROUP_COLORS.length],
    }))
  }, [usageByProviderQuery.data])

  const chartConfig: ChartConfig = {
    totalTokens: {
      label: t('adminDashboard.chart.totalTokens', {
        defaultValue: 'Total Tokens',
      }),
      color: 'var(--primary)',
    },
    requests: {
      label: t('adminDashboard.chart.requests', {
        defaultValue: 'Requests',
      }),
      color: 'var(--primary)',
    },
  }

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

      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <div className="mb-4 text-base font-semibold">
            {t('adminDashboard.chart.title24hTokens', {
              defaultValue: '24h Token Usage Trend',
            })}
          </div>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucketLabel"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="totalTokens"
                type="monotone"
                radius={0}
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="var(--color-primary)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </Card>

        <Card>
          <div className="mb-4 text-base font-semibold">
            {t('adminDashboard.chart.title24hRequestsByModelGroup', {
              defaultValue: '24h Requests by Model Group',
            })}
          </div>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart data={requestsByModelGroupData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="modelGroup"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatModelGroupLabel}
                minTickGap={12}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      formatModelGroupLabel(String(value || 'other'))
                    }
                  />
                }
              />
              <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                {requestsByModelGroupData.map((item) => (
                  <Cell key={item.modelGroup} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>

        <Card>
          <div className="mb-4 text-base font-semibold">
            {t('adminDashboard.chart.title24hRequestsByProvider', {
              defaultValue: '24h Requests by Provider',
            })}
          </div>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <BarChart data={requestsByProviderData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="providerName"
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => String(value || 'Unknown')}
                  />
                }
              />
              <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                {requestsByProviderData.map((item) => (
                  <Cell key={item.providerId} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
      </div>
    </PageContainer>
  )
}

export default Page
