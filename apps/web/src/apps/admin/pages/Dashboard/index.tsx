import { useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import { PageContainer } from '@/components/PageContainer'
import { useAdminDashboardUsagesByModelGroupGroupedQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesByModelGroupGroupedQuery'
import { useAdminDashboardUsagesByProviderGroupedQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesByProviderGroupedQuery'
import { useAdminDashboardUsagesGroupedQuery } from '@/apps/admin/hooks/queries/useAdminDashboardUsagesGroupedQuery'
import { Select } from '@openproxy/ui/Select'
import { Statistic } from '@openproxy/ui/Statistic'
import { useAdminDashboardStatsQuery } from '@/apps/admin/hooks/queries/useAdminDashboardStatsQuery'
import dayjs from '@openproxy/utils/dayjs'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@openproxy/ui/Chart'
import type { ChartConfig } from '@openproxy/ui/Chart'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

const MODEL_GROUP_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

const formatModelGroupLabel = (value: string) =>
  value
    .split('-')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')

const DASHBOARD_TIME_RANGE_OPTIONS = [
  { key: '24h', rangeHours: 24, bucketHours: 2 },
  { key: '7day', rangeHours: 24 * 7, bucketHours: 12 },
  { key: '15day', rangeHours: 24 * 15, bucketHours: 24 },
  { key: '30day', rangeHours: 24 * 30, bucketHours: 24 },
  { key: '3month', rangeHours: 24 * 90, bucketHours: 24 * 3 },
  { key: '6month', rangeHours: 24 * 180, bucketHours: 24 * 7 },
  { key: '1year', rangeHours: 24 * 365, bucketHours: 24 * 14 },
] as const

const toSeriesKey = (prefix: string, index: number) => `${prefix}-${index}`

const getBucketLabelFormat = (bucketHours: number) => {
  if (bucketHours <= 24) {
    return 'MM/DD HH:mm'
  }

  if (bucketHours <= 24 * 7) {
    return 'MM/DD'
  }

  return 'YYYY/MM/DD'
}

const Page = () => {
  const { t } = useTranslation('common')
  const [selectedRangeKey, setSelectedRangeKey] =
    useState<(typeof DASHBOARD_TIME_RANGE_OPTIONS)[number]['key']>('24h')
  const statsQuery = useAdminDashboardStatsQuery()
  const selectedRange =
    DASHBOARD_TIME_RANGE_OPTIONS.find(
      (item) => item.key === selectedRangeKey
    ) || DASHBOARD_TIME_RANGE_OPTIONS[0]
  const bucketLabelFormat = getBucketLabelFormat(selectedRange.bucketHours)
  const usageGroupedQuery = useAdminDashboardUsagesGroupedQuery({
    rangeHours: selectedRange.rangeHours,
    bucketHours: selectedRange.bucketHours,
  })
  const usageByModelGroupGroupedQuery =
    useAdminDashboardUsagesByModelGroupGroupedQuery({
      rangeHours: selectedRange.rangeHours,
      bucketHours: selectedRange.bucketHours,
    })
  const usageByProviderGroupedQuery =
    useAdminDashboardUsagesByProviderGroupedQuery({
      rangeHours: selectedRange.rangeHours,
      bucketHours: selectedRange.bucketHours,
    })
  const stats = statsQuery.data

  const formatNumber = (value?: number) => Number(value || 0).toLocaleString()
  const selectedRangeLabel = t(
    `adminDashboard.timeRange.${selectedRange.key}`,
    {
      defaultValue: selectedRange.key,
    }
  )
  const timeRangeOptions = DASHBOARD_TIME_RANGE_OPTIONS.map((item) => ({
    label: t(`adminDashboard.timeRange.${item.key}`, {
      defaultValue: item.key,
    }),
    value: item.key,
  }))

  const usageBuckets = useMemo(() => {
    return (usageGroupedQuery.data || []).map((item) => ({
      bucketAt: new Date(item.bucketAt),
      bucketLabel: dayjs(item.bucketAt).format(bucketLabelFormat),
    }))
  }, [usageGroupedQuery.data, bucketLabelFormat])

  const chartData = useMemo(() => {
    return (usageGroupedQuery.data || []).map((item) => ({
      bucketLabel: dayjs(item.bucketAt).format(bucketLabelFormat),
      requests: item.requests,
      totalTokens: item.tokensPrompt + item.tokensCompletion,
    }))
  }, [usageGroupedQuery.data, bucketLabelFormat])

  const requestsByModelGroupChart = useMemo(() => {
    const totalRequestsByGroup = new Map<string, number>()

    for (const item of usageByModelGroupGroupedQuery.data || []) {
      const group = item.modelGroup || 'other'
      totalRequestsByGroup.set(
        group,
        (totalRequestsByGroup.get(group) || 0) + Number(item.requests || 0)
      )
    }

    const series = Array.from(totalRequestsByGroup.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([modelGroup], index) => ({
        dataKey: toSeriesKey('model-group', index),
        modelGroup,
        label: formatModelGroupLabel(modelGroup),
        color: MODEL_GROUP_COLORS[index % MODEL_GROUP_COLORS.length],
      }))

    const seriesByModelGroup = new Map(
      series.map((item) => [item.modelGroup, item])
    )
    const data = usageBuckets.map((bucket) => {
      const baseRow: Record<string, string | number> = {
        bucketLabel: bucket.bucketLabel,
      }

      for (const item of series) {
        baseRow[item.dataKey] = 0
      }

      return baseRow
    })
    const rowByBucketAt = new Map(
      usageBuckets.map((bucket, index) => [bucket.bucketLabel, data[index]])
    )

    for (const item of usageByModelGroupGroupedQuery.data || []) {
      const row = rowByBucketAt.get(
        dayjs(item.bucketAt).format(bucketLabelFormat)
      )
      const seriesItem = seriesByModelGroup.get(item.modelGroup || 'other')

      if (!row || !seriesItem) {
        continue
      }

      row[seriesItem.dataKey] = Number(item.requests || 0)
    }

    const config: ChartConfig = Object.fromEntries(
      series.map((item) => [
        item.dataKey,
        {
          label: item.label,
          color: item.color,
        },
      ])
    )

    return { data, config, series }
  }, [usageBuckets, usageByModelGroupGroupedQuery.data, bucketLabelFormat])

  const requestsByProviderChart = useMemo(() => {
    const totalRequestsByProvider = new Map<
      string,
      { providerName: string; requests: number }
    >()

    for (const item of usageByProviderGroupedQuery.data || []) {
      const providerId = item.providerId || 'unknown'
      const current = totalRequestsByProvider.get(providerId)

      totalRequestsByProvider.set(providerId, {
        providerName: item.providerName || 'Unknown',
        requests: (current?.requests || 0) + Number(item.requests || 0),
      })
    }

    const series = Array.from(totalRequestsByProvider.entries())
      .sort((left, right) => right[1].requests - left[1].requests)
      .map(([providerId, item], index) => ({
        dataKey: toSeriesKey('provider', index),
        providerId,
        label: item.providerName,
        color: MODEL_GROUP_COLORS[index % MODEL_GROUP_COLORS.length],
      }))

    const seriesByProviderId = new Map(
      series.map((item) => [item.providerId, item])
    )
    const data = usageBuckets.map((bucket) => {
      const baseRow: Record<string, string | number> = {
        bucketLabel: bucket.bucketLabel,
      }

      for (const item of series) {
        baseRow[item.dataKey] = 0
      }

      return baseRow
    })
    const rowByBucketAt = new Map(
      usageBuckets.map((bucket, index) => [bucket.bucketLabel, data[index]])
    )

    for (const item of usageByProviderGroupedQuery.data || []) {
      const row = rowByBucketAt.get(
        dayjs(item.bucketAt).format(bucketLabelFormat)
      )
      const seriesItem = seriesByProviderId.get(item.providerId || 'unknown')

      if (!row || !seriesItem) {
        continue
      }

      row[seriesItem.dataKey] = Number(item.requests || 0)
    }

    const config: ChartConfig = Object.fromEntries(
      series.map((item) => [
        item.dataKey,
        {
          label: item.label,
          color: item.color,
        },
      ])
    )

    return { data, config, series }
  }, [usageBuckets, usageByProviderGroupedQuery.data, bucketLabelFormat])

  const chartConfig: ChartConfig = {
    totalTokens: {
      label: t('adminDashboard.chart.totalTokens', {
        defaultValue: 'Total Tokens',
      }),
      color: 'var(--primary)',
    },
  }

  return (
    <PageContainer title={t('dashboard.title', { defaultValue: 'Dashboard' })}>
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

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-40">
          <Select
            options={timeRangeOptions}
            value={selectedRangeKey}
            onChange={(value) => {
              setSelectedRangeKey(
                value as (typeof DASHBOARD_TIME_RANGE_OPTIONS)[number]['key']
              )
            }}
            placeholder={t('common.selectPlaceholder', {
              defaultValue: 'Please select',
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <div className="mb-4 text-base font-semibold">
            {t('adminDashboard.chart.title24hTokens', {
              range: selectedRangeLabel,
              defaultValue: '{{range}} Token Usage Trend',
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
              range: selectedRangeLabel,
              defaultValue: '{{range}} Requests by Model Group',
            })}
          </div>
          <ChartContainer
            config={requestsByModelGroupChart.config}
            className="h-80 w-full"
          >
            <BarChart data={requestsByModelGroupChart.data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucketLabel"
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => String(value || '-')}
                  />
                }
              />
              {requestsByModelGroupChart.series.map((item) => (
                <Bar
                  key={item.dataKey}
                  dataKey={item.dataKey}
                  stackId="requests"
                  fill={item.color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </Card>

        <Card>
          <div className="mb-4 text-base font-semibold">
            {t('adminDashboard.chart.title24hRequestsByProvider', {
              range: selectedRangeLabel,
              defaultValue: '{{range}} Requests by Provider',
            })}
          </div>
          <ChartContainer
            config={requestsByProviderChart.config}
            className="h-80 w-full"
          >
            <BarChart data={requestsByProviderChart.data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucketLabel"
                tickLine={false}
                axisLine={false}
                minTickGap={12}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => String(value || '-')}
                  />
                }
              />
              {requestsByProviderChart.series.map((item) => (
                <Bar
                  key={item.dataKey}
                  dataKey={item.dataKey}
                  stackId="requests"
                  fill={item.color}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </Card>
      </div>
    </PageContainer>
  )
}

export default Page
