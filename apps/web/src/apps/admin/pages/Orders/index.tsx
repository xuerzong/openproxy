import { useState } from 'react'
import dayjs from '@/utils/dayjs'
import { useAdminOrdersQuery } from '@/apps/admin/hooks/queries/useAdminOrdersQuery'
import { useAdminOrdersCountQuery } from '@/apps/admin/hooks/queries/useAdminOrdersCountQuery'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Tag } from '@/components/ui/Tag'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const [page, setPage] = useState(0)
  const constsQuery = useConstsQuery()
  const ordersQuery = useAdminOrdersQuery({ page })
  const ordersCountQuery = useAdminOrdersCountQuery()

  return (
    <PageContainer
      title={t('orders.title', { defaultValue: 'Orders' })}
      className="h-screen"
    >
      <FlexScrollViewer bordered>
        <Table
          rowKey={(d) => d.orderId}
          data={ordersQuery.data || []}
          columns={[
            {
              key: 'orderId',
              label: t('orders.table.orderId', { defaultValue: 'Order ID' }),
            },
            {
              key: 'userId',
              label: t('orders.table.userId', { defaultValue: 'User ID' }),
              width: 180,
            },
            {
              key: 'teamId',
              label: t('orders.table.teamId', { defaultValue: 'Team ID' }),
              width: 180,
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
              width: 120,
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
