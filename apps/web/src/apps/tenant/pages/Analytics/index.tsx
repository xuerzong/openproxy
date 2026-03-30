import { useEffect, useMemo, useState } from 'react'
import dayjs from '@openproxy/utils/dayjs'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { PageContainer } from '@/components/PageContainer'
import { useTeamMonthlyUsagesQuery } from '@/apps/tenant/hooks/queries/useTeamMonthlyUsagesQuery'
import { Select } from '@openproxy/ui/Select'
import { Statistic } from '@openproxy/ui/Statistic'
import { Table } from '@openproxy/ui/Table'

const MODEL_COLORS = [
  '#0f766e',
  '#2563eb',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
  '#ea580c',
]

const compactTokenFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const getMonthTimestamp = (value?: Date | string | null) => {
  if (!value) {
    return NaN
  }

  const parsed = value instanceof Date ? value : new Date(value)

  return parsed.getTime()
}

const formatMonthLabel = (value?: Date | string | null) => {
  const timestamp = getMonthTimestamp(value)

  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return dayjs(timestamp).format('YYYY/MM')
}

const formatTokenCount = (value?: number | string | null) => {
  const numericValue = Number(value || 0)

  if (!Number.isFinite(numericValue)) {
    return '0'
  }

  if (Math.abs(numericValue) < 1000) {
    return numericValue.toLocaleString()
  }

  return compactTokenFormatter
    .format(numericValue)
    .replace(/\.0(?=[A-Z]+$)/, '')
}

const Page = () => {
  const { t } = useTranslation('common')
  const monthlyUsagesQuery = useTeamMonthlyUsagesQuery()
  const monthlyUsages = monthlyUsagesQuery.data || []
  const [selectedMonthStart, setSelectedMonthStart] = useState<string>('')

  useEffect(() => {
    if (!selectedMonthStart && monthlyUsages[0]?.monthStart) {
      setSelectedMonthStart(monthlyUsages[0].monthStart.toISOString())
    }
  }, [monthlyUsages, selectedMonthStart])

  const monthOptions = useMemo(() => {
    return monthlyUsages.map((item) => ({
      value: item.monthStart.toISOString(),
      label: formatMonthLabel(item.monthStart),
    }))
  }, [monthlyUsages])

  const selectedSummary = useMemo(() => {
    return (
      monthlyUsages.find(
        (item) => item.monthStart.toISOString() === selectedMonthStart
      ) || monthlyUsages[0]
    )
  }, [monthlyUsages, selectedMonthStart])

  const chartData = useMemo(() => {
    return (selectedSummary?.modelBreakdown || []).map((item, index) => ({
      name: item.modelName,
      value: item.requests,
      share: Number(item.requestShare || 0),
      fill: MODEL_COLORS[index % MODEL_COLORS.length],
      totalTokens: Number(item.totalTokens || 0),
    }))
  }, [selectedSummary])

  const averageTokensPerRequest = selectedSummary?.totalRequests
    ? Math.round(
        (selectedSummary.totalTokens || 0) / selectedSummary.totalRequests
      )
    : 0

  return (
    <PageContainer title={t('analytics.title')}>
      <Card className="flex flex-col gap-2">
        <div className="text-sm text-primary/75">
          {t('analytics.description')}
        </div>
      </Card>

      <Select
        value={selectedSummary?.monthStart?.toISOString()}
        options={monthOptions}
        placeholder={t('common.selectPlaceholder')}
        onChange={(value) => setSelectedMonthStart(value)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="relative flex flex-col gap-3">
            <div className="text-sm font-medium mb-2">
              {t('analytics.selectedMonth')}
            </div>
            <div className="text-3xl font-bold">
              {formatMonthLabel(selectedSummary?.monthStart)}
            </div>
          </div>
        </Card>
        <Card>
          <Statistic
            title={t('analytics.totalCost')}
            value={Number(selectedSummary?.totalCost || 0)}
          />
        </Card>
        <Card>
          <Statistic
            title={t('analytics.requests')}
            value={Number(selectedSummary?.totalRequests || 0)}
          />
        </Card>
        <Card>
          <Statistic
            title={t('analytics.totalTokens')}
            value={Number(selectedSummary?.totalTokens || 0)}
            locales="en-US"
            format={{
              notation: 'compact',
              compactDisplay: 'short',
              maximumFractionDigits: 1,
            }}
          />
        </Card>
      </div>

      <Card className="flex flex-col gap-4 min-h-0">
        <div>
          <div className="text-lg font-semibold">
            {t('analytics.tableTitle')}
          </div>
          <div className="text-sm text-primary/75 mt-1">
            {t('analytics.tableDescription')}
          </div>
        </div>

        <FlexScrollViewer bordered>
          <Table
            rowKey={(record) => record.id}
            loading={monthlyUsagesQuery.isLoading}
            data={monthlyUsages}
            columns={[
              {
                key: 'monthStart',
                label: t('analytics.month'),
                width: 140,
                render: (value) => formatMonthLabel(value),
              },
              {
                key: 'totalCost',
                label: t('analytics.totalCost'),
                width: 180,
                align: 'right',
                render: (value) => Number(value || 0).toFixed(2),
              },
              {
                key: 'totalRequests',
                label: t('analytics.requests'),
                width: 160,
                align: 'right',
                render: (value) => Number(value || 0).toLocaleString(),
              },
              {
                key: 'totalTokens',
                label: t('analytics.totalTokens'),
                width: 180,
                align: 'right',
                render: (_, record) => formatTokenCount(record.totalTokens),
              },
              {
                key: 'modelBreakdown',
                label: t('analytics.models'),
                width: 140,
                align: 'right',
                render: (value) => Number(value?.length || 0).toLocaleString(),
              },
              {
                key: 'avgTokensPerRequest',
                label: t('analytics.avgTokensPerRequest'),
                width: 180,
                align: 'right',
                render: (_, record) => {
                  if (!record.totalRequests) {
                    return '0'
                  }

                  return Math.round(
                    Number(record.totalTokens || 0) / record.totalRequests
                  ).toLocaleString()
                },
              },
            ]}
            locale={{
              noData: t('common.noData'),
              emptyListHint: t('common.emptyListHint'),
            }}
          />
        </FlexScrollViewer>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <div className="text-lg font-semibold">
            {t('analytics.distributionTitle')}
          </div>
          <div className="text-sm text-primary/75 mt-1">
            {t('analytics.distributionDescription')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <Statistic
              title={t('analytics.activeModels')}
              value={Number(selectedSummary?.modelBreakdown?.length || 0)}
            />
          </Card>
          <Card className="p-4">
            <Statistic
              title={t('analytics.avgTokensPerRequest')}
              value={averageTokensPerRequest}
            />
          </Card>
        </div>

        {chartData.length ? (
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="rounded-md border border-border px-3 py-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs text-foreground/70">
                      {item.value.toLocaleString()} /{' '}
                      {Math.round(item.share * 100)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${Math.max(item.share * 100, item.value > 0 ? 4 : 0)}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-foreground/70">
                    <span>
                      {t('analytics.requests')}: {item.value.toLocaleString()}
                    </span>
                    <span>Tokens: {formatTokenCount(item.totalTokens)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-primary/70">
            {t('analytics.distributionEmpty')}
          </div>
        )}
      </Card>
    </PageContainer>
  )
}

export default Page
