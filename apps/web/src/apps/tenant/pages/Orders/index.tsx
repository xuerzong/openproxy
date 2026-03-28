import { useState } from 'react'
import dayjs from '@openproxy/utils/dayjs'
import { useOrdersQuery } from '@/apps/tenant/hooks/queries/useOrdersQuery'
import { useOrdersCountQuery } from '@/apps/tenant/hooks/queries/useOrdersCountQuery'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { Table } from '@openproxy/ui/Table'
import { Pagination } from '@openproxy/ui/Pagination'
import { Tag } from '@openproxy/ui/Tag'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const [page, setPage] = useState(0)
  const constsQuery = useConstsQuery()
  const ordersQuery = useOrdersQuery({ page })
  const ordersCountQuery = useOrdersCountQuery()

  return (
    <PageContainer
      title={t('orders.title', { defaultValue: 'Orders' })}
      className="h-screen"
    >
      <FlexScrollViewer bordered>
        <Table
          rowKey={(d) => d.orderId}
          loading={ordersQuery.isLoading}
          data={ordersQuery.data || []}
          columns={[
            {
              key: 'orderId',
              label: t('orders.table.orderId', { defaultValue: 'Order ID' }),
            },
            {
              key: 'status',
              label: t('orders.table.status', { defaultValue: 'Status' }),
              width: 160,
              align: 'center',
              render: (text) => {
                const payStatus = constsQuery.data?.supportedPayStatus[text]
                return payStatus ? (
                  <Tag color={payStatus.color as any}>{payStatus.label}</Tag>
                ) : (
                  '-'
                )
              },
            },
            {
              key: 'amount',
              label: t('orders.table.amount', { defaultValue: 'Amount' }),
              width: 160,
              align: 'right',
            },
            {
              key: 'createdAt',
              label: t('orders.table.createdAt', {
                defaultValue: 'Created At',
              }),
              width: 200,
              render(text) {
                return dayjs(text).format('YYYY/MM/DD HH:mm:ss')
              },
            },
          ]}
          locale={{
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
        />
      </FlexScrollViewer>

      <Pagination
        total={ordersCountQuery.data || 0}
        onValueChange={({ current }) => {
          setPage(current)
        }}
        locale={{
          next: t('common.next', { defaultValue: 'Next' }),
          prev: t('common.prev', { defaultValue: 'Prev' }),
        }}
      />
    </PageContainer>
  )
}

export default Page
