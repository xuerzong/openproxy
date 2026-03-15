import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { CopyButton } from '@/components/CopyButton'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Tag } from '@/components/ui/Tag'
import { useTeamMembersQuery } from '@/apps/tenant/hooks/queries/useTeamMembersQuery'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useRequest } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import dayjs from '@/utils/dayjs'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const teamQuery = useTeamQuery()
  const teamMembersQuery = useTeamMembersQuery()
  const [removingMember, setRemovingMember] = useState<any>(null)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const team = teamQuery.data?.team
  const members = teamMembersQuery.data || []
  const loading = teamQuery.isLoading || teamMembersQuery.isLoading
  const currentUserId = session?.user.id
  const currentMember = members.find(
    (member) => member.userId === currentUserId
  )
  const canManageMembers = currentMember?.role === 'owner'
  const inviteLink = team?.inviteCode
    ? `${window.location.origin}/join/${team.inviteCode}`
    : ''
  const memberLimitReached = members.length >= (team?.usersLimit || 0)

  const refreshTeamMembers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['team'] }),
      queryClient.invalidateQueries({ queryKey: ['team-members'] }),
      queryClient.invalidateQueries({ queryKey: ['teams'] }),
    ])
  }

  const roleOptions = useMemo(
    () => [
      {
        value: 'owner',
        label: t('teamSettings.members.roles.owner', { defaultValue: 'Owner' }),
      },
      {
        value: 'member',
        label: t('teamSettings.members.roles.member', {
          defaultValue: 'Member',
        }),
      },
    ],
    [t]
  )

  const onUpdateRole = async (memberId: string, role: string) => {
    if (!canManageMembers) {
      return
    }

    setUpdatingMemberId(memberId)
    const response = await request.team.members.role.put({
      id: memberId,
      role,
    })
    setUpdatingMemberId(null)

    if (response.error) {
      const status = Number(response.error.status)

      toast.error(
        status === 409
          ? t('teamSettings.members.messages.lastOwner', {
              defaultValue: 'At least one owner must remain in the team.',
            })
          : t('common.operationFailedWithStatus', {
              defaultValue: `Operation failed: ${response.error.status}`,
              status: response.error.status,
            })
      )
      return
    }

    toast.success(
      t('teamSettings.members.messages.roleUpdated', {
        defaultValue: 'Member role updated successfully',
      })
    )
    await refreshTeamMembers()
  }

  const onRemoveMember = async () => {
    if (!removingMember || removing) {
      return
    }

    setRemoving(true)
    const response = await request.team
      .members({ id: removingMember.id })
      .delete()
    setRemoving(false)

    if (response.error) {
      const status = Number(response.error.status)

      toast.error(
        status === 409
          ? t('teamSettings.members.messages.lastOwner', {
              defaultValue: 'At least one owner must remain in the team.',
            })
          : status === 400
            ? t('teamSettings.members.messages.selfRemoveBlocked', {
                defaultValue: 'You cannot remove yourself from this page.',
              })
            : t('common.operationFailedWithStatus', {
                defaultValue: `Operation failed: ${response.error.status}`,
                status: response.error.status,
              })
      )
      return
    }

    setRemovingMember(null)
    toast.success(
      t('teamSettings.members.messages.memberRemoved', {
        defaultValue: 'Member removed successfully',
      })
    )
    await refreshTeamMembers()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              {t('teamSettings.members.inviteTitle', {
                defaultValue: 'Invite Members',
              })}
            </div>
            <div className="text-sm text-secondary mt-1">
              {t('teamSettings.members.inviteDescription', {
                defaultValue:
                  'Share the invitation link to let users join the current team. When seats are full, invitees will see a warning.',
              })}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-6 w-28 rounded-full" />
          ) : (
            <Tag color={memberLimitReached ? 'yellow' : 'green'}>
              {members.length}/{team?.usersLimit || 0}{' '}
              {t('teamSettings.members.seatsUsed', {
                defaultValue: 'seats used',
              })}
            </Tag>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Input
            value={inviteLink || '-'}
            readOnly
            suffix={inviteLink ? <CopyButton text={inviteLink} /> : null}
          />
        )}

        {!loading && memberLimitReached ? (
          <div className="text-sm text-yellow-700 dark:text-yellow-400">
            {t('teamSettings.members.limitReached', {
              defaultValue:
                'The current team has no remaining seats. New users cannot join until a seat is freed.',
            })}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 min-h-0">
        <div>
          <div className="text-lg font-semibold">
            {t('teamSettings.members.listTitle', {
              defaultValue: 'User Management',
            })}
          </div>
          <div className="text-sm text-secondary mt-1">
            {canManageMembers
              ? t('teamSettings.members.manageDescription', {
                  defaultValue:
                    'Owners can change member roles and remove members from the team.',
                })
              : t('teamSettings.members.readonlyDescription', {
                  defaultValue:
                    'Only team owners can change roles or remove members.',
                })}
          </div>
        </div>

        {loading ? (
          <FlexScrollViewer bordered>
            <div className="overflow-hidden min-w-250">
              <div className="grid grid-cols-[220px_260px_180px_200px_140px] gap-0 border-b border-border bg-muted/30">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              {Array.from({ length: 4 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-[220px_260px_180px_200px_140px] gap-0 border-b border-border last:border-b-0"
                >
                  <div className="px-4 py-4">
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="px-4 py-4">
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="px-4 py-4">
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                  <div className="px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="px-4 py-4 flex justify-center">
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </FlexScrollViewer>
        ) : (
          <FlexScrollViewer bordered>
            <Table
              rowKey={(record) => record.id}
              data={members}
              columns={[
                {
                  key: 'name',
                  label: t('teams.members.name', { defaultValue: 'Name' }),
                  width: 220,
                  render: (_, record) => record.user?.name || '-',
                },
                {
                  key: 'email',
                  label: t('teams.members.email', { defaultValue: 'Email' }),
                  width: 260,
                  render: (_, record) => record.user?.email || '-',
                },
                {
                  key: 'role',
                  label: t('teams.members.role', { defaultValue: 'Role' }),
                  width: 180,
                  render: (value, record) =>
                    canManageMembers ? (
                      <Select
                        value={value}
                        options={roleOptions}
                        onChange={(nextRole) => {
                          if (nextRole !== value) {
                            onUpdateRole(record.id, nextRole)
                          }
                        }}
                        triggerClassName="w-36"
                        disabled={updatingMemberId === record.id}
                      />
                    ) : (
                      <Tag color={value === 'owner' ? 'green' : 'default'}>
                        {value === 'owner'
                          ? t('teamSettings.members.roles.owner', {
                              defaultValue: 'Owner',
                            })
                          : t('teamSettings.members.roles.member', {
                              defaultValue: 'Member',
                            })}
                      </Tag>
                    ),
                },
                {
                  key: 'createdAt',
                  label: t('teams.members.joinedAt', {
                    defaultValue: 'Joined At',
                  }),
                  width: 200,
                  render: (value) => dayjs(value).format('YYYY/MM/DD HH:mm:ss'),
                },
                {
                  key: 'operation',
                  label: t('common.operation', { defaultValue: 'Operation' }),
                  width: 140,
                  align: 'center',
                  fixed: 'right',
                  render: (_, record) => (
                    <Button
                      variant="danger"
                      size="icon-xs"
                      disabled={
                        !canManageMembers || record.userId === currentUserId
                      }
                      aria-label={t('actions.delete', {
                        defaultValue: 'Delete',
                      })}
                      title={t('actions.delete', {
                        defaultValue: 'Delete',
                      })}
                      onClick={() => setRemovingMember(record)}
                    >
                      <TrashIcon />
                    </Button>
                  ),
                },
              ]}
            />
          </FlexScrollViewer>
        )}
      </Card>

      <Dialog
        title={t('teamSettings.members.confirmRemoveTitle', {
          defaultValue: 'Remove this member?',
        })}
        description={t('teamSettings.members.confirmRemoveDescription', {
          defaultValue:
            'The member will immediately lose access to the current team after removal.',
        })}
        open={Boolean(removingMember)}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingMember(null)
          }
        }}
        footer={
          <DialogFooter
            okText={t('actions.delete', {
              defaultValue: 'Delete',
            })}
            okButtonProps={{
              variant: 'danger',
              loading: removing,
            }}
            onCancel={() => setRemovingMember(null)}
            onOk={onRemoveMember}
          />
        }
      />
    </div>
  )
}

export default Page
