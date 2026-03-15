import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useDebounce } from 'use-debounce'
import { MoreHorizontalIcon, PenSquareIcon, WalletIcon } from 'lucide-react'
import { TeamRechargeModal } from './TeamRechargeModal'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Table } from '@/components/ui/Table'
import { useAdminTeamsCountQuery } from '@/apps/admin/hooks/queries/useAdminTeamsCountQuery'
import { useAdminTeamsQuery } from '@/apps/admin/hooks/queries/useAdminTeamsQuery'
import dayjs from '@/utils/dayjs'

const Page = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [debouncedKeyword] = useDebounce(keyword, 300)
  const teamsQuery = useAdminTeamsQuery({
    page,
    keyword: debouncedKeyword || undefined,
  })
  const teamsCountQuery = useAdminTeamsCountQuery({
    keyword: debouncedKeyword || undefined,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedKeyword])

  const refreshTeams = () => {
    teamsQuery.refetch()
    teamsCountQuery.refetch()
  }

  return (
    <PageContainer
      title={t('teams.title', { defaultValue: 'Teams' })}
      className="h-screen"
    >
      <div className="shrink-0">
        <Input
          className="max-w-sm"
          value={keyword}
          placeholder={t('teams.searchPlaceholder', {
            defaultValue: 'Search teams by name...',
          })}
          onChange={(event) => {
            setKeyword(event.target.value)
          }}
        />
      </div>

      <FlexScrollViewer bordered>
        <Table
          rowKey={(team) => team.id}
          data={teamsQuery.data || []}
          columns={[
            {
              key: 'id',
              label: t('common.id', { defaultValue: 'ID' }),
              width: 180,
            },
            {
              key: 'name',
              label: t('teams.table.name', { defaultValue: 'Name' }),
              width: 220,
            },
            {
              key: 'inviteCode',
              label: t('teams.table.inviteCode', {
                defaultValue: 'Invite Code',
              }),
              width: 160,
            },
            {
              key: 'memberCount',
              label: t('teams.table.memberCount', { defaultValue: 'Members' }),
              width: 120,
              align: 'center',
            },
            {
              key: 'apiKeyLimit',
              label: t('teams.table.apiKeyLimit', {
                defaultValue: 'API Key Limit',
              }),
              width: 140,
              align: 'center',
            },
            {
              key: 'usersLimit',
              label: t('teams.table.usersLimit', {
                defaultValue: 'User Limit',
              }),
              width: 120,
              align: 'center',
            },
            {
              key: 'amount',
              label: t('teams.table.amount', { defaultValue: 'Balance' }),
              width: 140,
              align: 'right',
            },
            {
              key: 'createdAt',
              label: t('teams.table.createdAt', { defaultValue: 'Created At' }),
              width: 200,
              render: (text) => dayjs(text).format('YYYY/MM/DD HH:mm:ss'),
            },
            {
              key: 'operation',
              label: t('common.operation', { defaultValue: 'Operation' }),
              width: 100,
              align: 'center',
              fixed: 'right',
              render: (_, record) => {
                return (
                  <div className="flex justify-center">
                    <DropdownMenu
                      menus={[
                        {
                          type: 'item',
                          key: 'manage',
                          label: t('teams.actions.manage', {
                            defaultValue: 'Manage',
                          }),
                          icon: <PenSquareIcon />,
                          onClick() {
                            navigate(`/teams/${record.id}`)
                          },
                        },
                        {
                          type: 'item',
                          key: 'recharge',
                          label: t('teams.actions.recharge', {
                            defaultValue: 'Recharge',
                          }),
                          icon: <WalletIcon />,
                          onClick() {
                            setSelectedTeam(record)
                            setRechargeOpen(true)
                          },
                        },
                      ]}
                    >
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenu>
                  </div>
                )
              },
            },
          ]}
        />
      </FlexScrollViewer>

      <Pagination
        total={teamsCountQuery.data || 0}
        onValueChange={({ current }) => {
          setPage(current)
        }}
        locale={{
          next: t('common.next', { defaultValue: 'Next' }),
          prev: t('common.prev', { defaultValue: 'Prev' }),
        }}
      />

      <TeamRechargeModal
        open={rechargeOpen}
        onOpenChange={setRechargeOpen}
        team={selectedTeam}
        onSuccess={(team) => {
          setSelectedTeam(team)
          refreshTeams()
        }}
      />
    </PageContainer>
  )
}

export default Page
