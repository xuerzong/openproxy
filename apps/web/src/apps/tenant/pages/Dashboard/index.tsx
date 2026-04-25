import { useMemo, useState } from 'react'
import { ModelIcon } from '@/components/ModelIcon'
import { Card } from '@/components/Card'
import { Statistic } from '@openproxy/ui/Statistic'
import { useUsagesQuery } from '@/apps/tenant/hooks/queries/useUsagesQuery'
import dayjs from '@openproxy/utils/dayjs'
import { useUsagesTotalQuery } from '@/apps/tenant/hooks/queries/useUsagesCountQuery'
import { BillingModal } from '@/components/BillingModal'
import { Table } from '@openproxy/ui/Table'
import { Pagination } from '@openproxy/ui/Pagination'
import { Button } from '@openproxy/ui/Button'
import { Tag } from '@openproxy/ui/Tag'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { SparklineStatisticCard } from '@/components/SparklineStatisticCard'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useUsagesGroupedQuery } from '@/apps/tenant/hooks/queries/useUsagesGroupedQuery'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@openproxy/ui/Chart'
import type { ChartConfig } from '@openproxy/ui/Chart'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useIsOSS } from '@/hooks/useIsOSS'

const Page = () => {
  const { t } = useTranslation('common')
  const isOSS = useIsOSS()
  const showBillingActions = !isOSS

  const translateDashboard = (key: string, defaultValue: string) =>
    t(`dashboard.${key}`, { defaultValue })

  const [page, setPage] = useState(1)
  const teamQuery = useTeamQuery()
  const usagesQuery = useUsagesQuery({ page })
  const usagesTotalQuery = useUsagesTotalQuery()
  const usagesGroupedQuery = useUsagesGroupedQuery({
    rangeHours: 24,
    bucketHours: 2,
  })
  const [billingOpen, setBillingOpen] = useState(false)

  const balance = teamQuery.data?.team.amount
  const requestTotal = useMemo(() => {
    return (usagesGroupedQuery.data || []).reduce((sum, item) => {
      return sum + Number(item.requests || 0)
    }, 0)
  }, [usagesGroupedQuery.data])

  const chartData = useMemo(() => {
    return (usagesGroupedQuery.data || []).map((item) => ({
      bucketLabel: dayjs(item.bucketAt).format('MM/DD HH:mm'),
      requests: item.requests,
      totalTokens: item.tokensPrompt + item.tokensCompletion,
    }))
  }, [usagesGroupedQuery.data])

  const chartConfig: ChartConfig = {
    totalTokens: {
      label: translateDashboard('chart.totalTokens', 'Total Tokens'),
      color: 'var(--primary)',
    },
  }

  const requestChartConfig: ChartConfig = {
    requests: {
      label: translateDashboard('chart.requests', 'Requests'),
      color: 'var(--primary)',
    },
  }

  return (
    <PageContainer title={translateDashboard('title', 'Dashboard')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <Card>
          <Statistic
            title={translateDashboard('balance', 'Balance')}
            value={balance ? Number(balance).toFixed(2) : '0.00'}
            valueAction={
              showBillingActions ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      teamQuery.refetch()
                    }}
                  >
                    {translateDashboard('refresh', 'Refresh')}
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={() => {
                      setBillingOpen(true)
                    }}
                  >
                    {translateDashboard('recharge', 'Recharge')}
                  </Button>
                </div>
              ) : undefined
            }
          />
        </Card>

        <SparklineStatisticCard
          title={translateDashboard('summary24hRequests', 'Requests (24h)')}
          value={requestTotal}
          chart={
            <ChartContainer config={requestChartConfig} className="h-20 w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
              >
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="requests"
                  type="monotone"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="var(--color-primary)"
                  fillOpacity={0.18}
                />
              </AreaChart>
            </ChartContainer>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <div className="mb-4 text-base font-semibold">
            {translateDashboard('chart.title24h', '24h Request Trend')}
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
                fillOpacity={0.12}
              />
            </AreaChart>
          </ChartContainer>
        </Card>
      </div>

      <div>
        <div className="text-base font-semibold">
          {translateDashboard('recentRequestsTitle', 'Recent Requests')}
        </div>
        <div className="mt-1 text-sm text-primary/75">
          {translateDashboard(
            'recentRequestsDescription',
            'Latest requests from the current team within the recent 24 hours.'
          )}
        </div>
      </div>

      <FlexScrollViewer bordered>
        <Table
          rowKey={(d) => d.id}
          loading={usagesQuery.isLoading}
          columns={[
            {
              key: 'createdAt',
              label: translateDashboard('table.time', 'Time'),
              width: 200,
              align: 'left',
              render(text) {
                return dayjs(text).format('YYYY/MM/DD HH:mm:ss')
              },
            },
            {
              key: 'model',
              label: translateDashboard('table.model', 'Model'),
              width: 240,
              render: (_, record) => {
                return (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <ModelIcon model={record.modelOwnedBy} />
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {record.modelName}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'cost',
              label: translateDashboard('table.costYuan', 'Cost (CNY)'),
              width: 200,
              align: 'right',
              render: (text) => text || '-',
            },
            {
              key: 'tokensPrompt',
              label: translateDashboard('table.tokenInput', 'Token Input'),
              align: 'right',
              width: 160,
            },
            {
              key: 'tokensCompletion',
              label: translateDashboard('table.tokenOutput', 'Token Output'),
              align: 'right',
              width: 160,
            },
            {
              key: 'isStream',
              label: t('dashboard.table.streamOutput'),
              width: 140,
              align: 'center',
              render: (text) => (
                <Tag color={text ? 'green' : 'yellow'}>
                  {text ? t('common.yes') : t('common.no')}
                </Tag>
              ),
            },
            {
              key: 'responseTime',
              label: translateDashboard(
                'table.responseSeconds',
                'Response Time (s)'
              ),
              width: 160,
              align: 'right',
              render: (text) => text / 1000,
            },
            {
              key: 'completedTime',
              label: translateDashboard(
                'table.completedSeconds',
                'Completion Time (s)'
              ),
              width: 180,
              align: 'right',
              render: (text) => text / 1000,
            },
            {
              key: 'aiProvider',
              label: translateDashboard('table.providerName', 'Provider'),
              width: 180,
              align: 'left',
              render: (_, record) => {
                return (
                  <div className="flex items-center gap-1">
                    {record.aiProvider?.id && (
                      <ModelIcon model={record.aiProvider.id} />
                    )}
                    <span>{record.aiProvider?.name || '-'}</span>
                  </div>
                )
              },
            },
          ]}
          data={usagesQuery.data || []}
          locale={{
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
        />
      </FlexScrollViewer>

      <div>
        <Pagination
          total={usagesTotalQuery.data || 0}
          onValueChange={({ current }) => {
            setPage(current)
          }}
          pageSize={50}
          locale={{
            prev: translateDashboard('pagination.prev', 'Prev'),
            next: translateDashboard('pagination.next', 'Next'),
          }}
        />
      </div>

      {showBillingActions ? (
        <BillingModal
          open={billingOpen}
          onOpenChange={setBillingOpen}
          onFinish={() => {
            teamQuery.refetch()
          }}
        />
      ) : null}
    </PageContainer>
  )
}

export default Page
