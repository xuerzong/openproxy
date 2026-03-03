import { useMemo, useState } from 'react'
import { ModelIcon } from '@/components/ModelIcon'
import { Card } from '@/components/Card'
import { Statistic } from '@/components/ui/Statistic'
import { useUsagesQuery } from '@/apps/tenant/hooks/queries/useUsagesQuery'
import dayjs from '@/utils/dayjs'
import { useUsagesTotalQuery } from '@/apps/tenant/hooks/queries/useUsagesCountQuery'
import { BillingModal } from '@/components/BillingModal'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useUsagesGroupedQuery } from '@/apps/tenant/hooks/queries/useUsagesGroupedQuery'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/Chart'
import type { ChartConfig } from '@/components/ui/Chart'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const showBillingActions =
    import.meta.env.VITE_SHOW_BILLING_ACTIONS !== 'false'

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

  const chartData = useMemo(() => {
    return (usagesGroupedQuery.data || []).map((item) => ({
      bucketLabel: dayjs(item.bucketAt).format('MM/DD HH:mm'),
      requests: item.requests,
    }))
  }, [usagesGroupedQuery.data])

  const chartConfig: ChartConfig = {
    requests: {
      label: translateDashboard('chart.requests', 'Requests'),
      color: 'var(--primary)',
    },
  }

  return (
    <PageContainer title={translateDashboard('title', 'Dashboard')}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <div className="mb-4 text-base font-semibold">
            {translateDashboard('chart.title24h', '24h Request Trend')}
          </div>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucketLabel"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar
                dataKey="requests"
                fill="var(--color-foreground)"
                radius={0}
              />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <FlexScrollViewer bordered>
        <Table
          rowKey={(d) => d.id}
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
              key: 'aiProviderName',
              label: translateDashboard('table.providerName', 'Provider'),
              width: 160,
              align: 'left',
              render: (text) => text || '-',
            },
          ]}
          data={usagesQuery.data || []}
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
