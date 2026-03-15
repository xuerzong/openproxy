import { useState } from 'react'
import { useUsersQuery } from '@/apps/admin/hooks/queries/useUsersQuery'
import dayjs from '@/utils/dayjs'
import { useRequest } from '@/contexts/ApiContext'
import { toast } from 'sonner'
import { useUsersCountQuery } from '@/apps/admin/hooks/queries/useUsersCountQuery'
import { Table } from '@openproxy/ui/Table'
import { Pagination } from '@openproxy/ui/Pagination'
import { Tag } from '@openproxy/ui/Tag'
import { Switch } from '@openproxy/ui/Switch'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next'

const Page = () => {
  const { t } = useTranslation('common')
  const [page, setPage] = useState(1)
  const usersQuery = useUsersQuery({ page })
  const usersCountQuery = useUsersCountQuery()
  const request = useRequest()

  return (
    <PageContainer
      title={t('users.title', { defaultValue: 'Users' })}
      className="h-screen"
    >
      <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-md">
        <Table
          rowKey={(d) => d.id}
          columns={[
            {
              key: 'id',
              label: t('common.id', { defaultValue: 'ID' }),
              width: 240,
            },
            {
              key: 'email',
              label: t('users.table.email', { defaultValue: 'Email' }),
              width: 240,
              ellipsis: true,
              render: (text) => text || '-',
            },
            {
              key: 'emailVerified',
              label: t('users.table.emailVerified', {
                defaultValue: 'Email Verified',
              }),
              width: 160,

              render: (text, record) =>
                record.email ? (
                  text ? (
                    <Tag color="green">
                      {t('common.verified', { defaultValue: 'Verified' })}
                    </Tag>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={text}
                        onCheckedChange={(checked) => {
                          request.changeUserEmailVerified
                            .put({ emailVerified: checked, userId: record.id })
                            .then(() => {
                              usersQuery.refetch()
                              toast.success(
                                t('users.messages.emailVerifyUpdated', {
                                  defaultValue:
                                    'Email verification status updated',
                                })
                              )
                            })
                            .catch((e) => {
                              toast.error(
                                e.message ||
                                  t('common.updateFailed', {
                                    defaultValue: 'Update failed',
                                  })
                              )
                            })
                        }}
                      />
                      <Tag color="yellow">
                        {t('common.unverified', { defaultValue: 'Unverified' })}
                      </Tag>
                    </div>
                  )
                ) : (
                  '-'
                ),
            },

            {
              key: 'phoneNumber',
              label: t('users.table.phone', { defaultValue: 'Phone' }),
              width: 160,
              render: (text) => text || '-',
            },

            {
              key: 'createdAt',
              label: t('users.table.createdAt', { defaultValue: 'Created At' }),
              width: 160,
              render: (text) => dayjs(text).format('YYYY/MM/DD'),
            },
          ]}
          data={usersQuery.data || []}
          locale={{
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
        />
      </div>

      <Pagination
        total={usersCountQuery.data || 0}
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
