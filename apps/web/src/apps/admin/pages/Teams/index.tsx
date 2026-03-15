import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { RefreshCcwIcon, Trash2Icon } from 'lucide-react'
import { TeamRechargeModal } from './TeamRechargeModal'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Form, FormField, useForm } from '@/components/ui/Form'
import { Input, Textarea } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { Pagination } from '@/components/ui/Pagination'
import { Switch } from '@/components/ui/Switch'
import { Tag } from '@/components/ui/Tag'
import { Table } from '@/components/ui/Table'
import { useAdminTeamMembersQuery } from '@/apps/admin/hooks/queries/useAdminTeamMembersQuery'
import { useAdminTeamsCountQuery } from '@/apps/admin/hooks/queries/useAdminTeamsCountQuery'
import { useAdminTeamsQuery } from '@/apps/admin/hooks/queries/useAdminTeamsQuery'
import { useRequest } from '@/contexts/ApiContext'
import dayjs from '@/utils/dayjs'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    null | 'delete' | 'disable' | 'enable'
  >(null)
  const [debouncedKeyword] = useDebounce(keyword, 300)
  const [teamForm] = useForm({
    defaultValues: {
      id: '',
      name: '',
      inviteCode: '',
      apiKeyLimit: 1,
      usersLimit: 1,
      allowJoin: true,
      joinDisabledReason: '',
    },
  })
  const teamsQuery = useAdminTeamsQuery({
    page,
    keyword: debouncedKeyword || undefined,
  })
  const teamsCountQuery = useAdminTeamsCountQuery({
    keyword: debouncedKeyword || undefined,
  })
  const teamMembersQuery = useAdminTeamMembersQuery({
    teamId: selectedTeam?.id,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedKeyword])

  const closeTeamDialog = () => {
    setTeamDialogOpen(false)
    setSelectedTeam(null)
    setConfirmAction(null)
    teamForm.resetErrors()
    teamForm.resetValues()
  }

  const refreshTeams = () => {
    teamsQuery.refetch()
    teamsCountQuery.refetch()
  }

  const onOpenTeamDialog = (team: any) => {
    setSelectedTeam(team)
    setTeamDialogOpen(true)
    teamForm.setValues({
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      apiKeyLimit: team.apiKeyLimit,
      usersLimit: team.usersLimit,
      allowJoin: team.allowJoin !== false,
      joinDisabledReason: team.joinDisabledReason || '',
    })
  }

  const syncSelectedTeam = (team: any) => {
    setSelectedTeam(team)
    teamForm.setValues({
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      apiKeyLimit: team.apiKeyLimit,
      usersLimit: team.usersLimit,
      allowJoin: team.allowJoin !== false,
      joinDisabledReason: team.joinDisabledReason || '',
    })
  }

  const onUpdateTeam = () => {
    teamForm.onSubmit(async (values) => {
      const response = await request.admin.teams.put(values)

      if (response.error) {
        toast.error(
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${response.error.status}`,
            status: response.error.status,
          })
        )
        return
      }

      toast.success(
        t('teams.messages.updateSuccess', {
          defaultValue: 'Team updated successfully',
        })
      )
      syncSelectedTeam(response.data)
      refreshTeams()
    })
  }

  const onResetInviteCode = async () => {
    if (!selectedTeam) {
      return
    }

    const response = await request.admin.teams.resetInviteCode.post({
      id: selectedTeam.id,
    })

    if (response.error) {
      toast.error(
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${response.error.status}`,
          status: response.error.status,
        })
      )
      return
    }

    toast.success(
      t('teams.messages.inviteCodeReset', {
        defaultValue: 'Invite code reset successfully',
      })
    )
    syncSelectedTeam(response.data)
    refreshTeams()
  }

  const onSetTeamDisabled = async (disabled: boolean) => {
    if (!selectedTeam) {
      return
    }

    const response = await request.admin.teams.status.put({
      id: selectedTeam.id,
      disabled,
    })

    if (response.error) {
      toast.error(
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${response.error.status}`,
          status: response.error.status,
        })
      )
      return
    }

    toast.success(
      t(
        disabled
          ? 'teams.messages.disabledSuccess'
          : 'teams.messages.enabledSuccess',
        {
          defaultValue: disabled
            ? 'Team disabled successfully'
            : 'Team enabled successfully',
        }
      )
    )
    syncSelectedTeam(response.data)
    refreshTeams()
    setConfirmAction(null)
  }

  const onDeleteTeam = async () => {
    if (!selectedTeam) {
      return
    }

    const response = await request.admin.teams({ id: selectedTeam.id }).delete()

    if (response.error) {
      toast.error(
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${response.error.status}`,
          status: response.error.status,
        })
      )
      return
    }

    toast.success(
      t('teams.messages.deleteSuccess', {
        defaultValue: 'Team deleted successfully',
      })
    )
    refreshTeams()
    closeTeamDialog()
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
              key: 'disabled',
              label: t('teams.table.status', { defaultValue: 'Status' }),
              width: 120,
              align: 'center',
              render: (value) =>
                value ? (
                  <Tag color="yellow">
                    {t('teams.status.disabled', { defaultValue: 'Disabled' })}
                  </Tag>
                ) : (
                  <Tag color="green">
                    {t('teams.status.active', { defaultValue: 'Active' })}
                  </Tag>
                ),
            },
            {
              key: 'allowJoin',
              label: t('teams.table.joinAccess', {
                defaultValue: 'Join Access',
              }),
              width: 140,
              align: 'center',
              render: (value) =>
                value ? (
                  <Tag color="green">
                    {t('teams.joinAccess.allowed', {
                      defaultValue: 'Allowed',
                    })}
                  </Tag>
                ) : (
                  <Tag color="yellow">
                    {t('teams.joinAccess.blocked', {
                      defaultValue: 'Blocked',
                    })}
                  </Tag>
                ),
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
              width: 220,
              align: 'center',
              fixed: 'right',
              render: (_, record) => (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onOpenTeamDialog(record)
                    }}
                  >
                    {t('teams.actions.manage', { defaultValue: 'Manage' })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeam(record)
                      setRechargeOpen(true)
                    }}
                  >
                    {t('teams.actions.recharge', {
                      defaultValue: 'Recharge Team',
                    })}
                  </Button>
                </div>
              ),
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

      <Dialog
        title={t('teams.detailTitle', { defaultValue: 'Team Details' })}
        description={t('teams.detailDescription', {
          defaultValue: 'Review team information and update limits.',
        })}
        open={teamDialogOpen && Boolean(selectedTeam)}
        onOpenChange={(open) => {
          if (!open) {
            closeTeamDialog()
          }
        }}
        footer={
          <DialogFooter
            onCancel={closeTeamDialog}
            onOk={onUpdateTeam}
            okText={t('actions.save', { defaultValue: 'Save' })}
          />
        }
      >
        {selectedTeam && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">
                  {t('common.id', { defaultValue: 'ID' })}
                </div>
                <div className="break-all">{selectedTeam.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('teams.table.inviteCode', { defaultValue: 'Invite Code' })}
                </div>
                <div className="flex items-center gap-2">
                  <span>{selectedTeam.inviteCode}</span>
                  {selectedTeam.disabled ? (
                    <Tag color="yellow">
                      {t('teams.status.disabled', { defaultValue: 'Disabled' })}
                    </Tag>
                  ) : (
                    <Tag color="green">
                      {t('teams.status.active', { defaultValue: 'Active' })}
                    </Tag>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('teams.table.memberCount', { defaultValue: 'Members' })}
                </div>
                <div>{selectedTeam.memberCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('teams.table.amount', { defaultValue: 'Balance' })}
                </div>
                <div>{selectedTeam.amount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('teams.table.createdAt', { defaultValue: 'Created At' })}
                </div>
                <div>
                  {dayjs(selectedTeam.createdAt).format('YYYY/MM/DD HH:mm:ss')}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('teams.table.updatedAt', { defaultValue: 'Updated At' })}
                </div>
                <div>
                  {dayjs(selectedTeam.updatedAt).format('YYYY/MM/DD HH:mm:ss')}
                </div>
              </div>
            </div>

            <Form form={teamForm}>
              <div className="flex flex-col gap-4">
                <FormField
                  name="name"
                  label={t('teams.form.name', { defaultValue: 'Team Name' })}
                >
                  <Input
                    placeholder={t('teams.form.namePlaceholder', {
                      defaultValue: 'Please input team name',
                    })}
                  />
                </FormField>

                <FormField
                  name="inviteCode"
                  label={t('teams.form.inviteCode', {
                    defaultValue: 'Invite Code',
                  })}
                >
                  <Input
                    placeholder={t('teams.form.inviteCodePlaceholder', {
                      defaultValue: 'Please input invite code',
                    })}
                  />
                </FormField>

                <div>
                  <Button variant="outline" onClick={onResetInviteCode}>
                    <RefreshCcwIcon className="w-4 h-4" />
                    {t('teams.actions.resetInviteCode', {
                      defaultValue: 'Reset Invite Code',
                    })}
                  </Button>
                </div>

                <FormField
                  name="apiKeyLimit"
                  label={t('teams.form.apiKeyLimit', {
                    defaultValue: 'API Key Limit',
                  })}
                >
                  <NumberInput min={1} />
                </FormField>

                <FormField
                  name="usersLimit"
                  label={t('teams.form.usersLimit', {
                    defaultValue: 'User Limit',
                  })}
                >
                  <NumberInput min={1} />
                </FormField>

                <FormField
                  name="allowJoin"
                  label={t('teams.form.allowJoin', {
                    defaultValue: 'Allow users to join via invite link',
                  })}
                >
                  <div className="flex items-center gap-3">
                    <Switch />
                    <span className="text-sm text-secondary">
                      {teamForm.values.allowJoin
                        ? t('teams.form.allowJoinEnabled', {
                            defaultValue:
                              'Users can join this team with a valid invite link.',
                          })
                        : t('teams.form.allowJoinDisabled', {
                            defaultValue:
                              'Invite links stay visible, but new users cannot join this team.',
                          })}
                    </span>
                  </div>
                </FormField>

                <FormField
                  name="joinDisabledReason"
                  label={t('teams.form.joinDisabledReason', {
                    defaultValue: 'Join blocked reason',
                  })}
                  hidden={teamForm.values.allowJoin}
                >
                  <Textarea
                    placeholder={t('teams.form.joinDisabledReasonPlaceholder', {
                      defaultValue:
                        'Explain why users cannot join this team right now.',
                    })}
                  />
                </FormField>
              </div>
            </Form>

            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">
                {t('teams.members.title', { defaultValue: 'Members' })}
              </div>
              <div className="max-h-64 overflow-y-auto border border-border rounded-md">
                <Table
                  rowKey={(member) => member.id}
                  data={teamMembersQuery.data || []}
                  columns={[
                    {
                      key: 'name',
                      label: t('teams.members.name', { defaultValue: 'Name' }),
                      render: (_, record) => record.user?.name || '-',
                    },
                    {
                      key: 'email',
                      label: t('teams.members.email', {
                        defaultValue: 'Email',
                      }),
                      render: (_, record) => record.user?.email || '-',
                    },
                    {
                      key: 'role',
                      label: t('teams.members.role', { defaultValue: 'Role' }),
                      width: 120,
                    },
                    {
                      key: 'createdAt',
                      label: t('teams.members.joinedAt', {
                        defaultValue: 'Joined At',
                      }),
                      width: 180,
                      render: (_, record) =>
                        dayjs(record.createdAt).format('YYYY/MM/DD HH:mm:ss'),
                    },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-danger/20 bg-danger/5 p-4">
              <div className="text-sm font-medium text-danger">
                {t('teams.dangerZone.title', { defaultValue: 'Danger Zone' })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmAction(
                      selectedTeam.disabled ? 'enable' : 'disable'
                    )
                  }}
                >
                  {selectedTeam.disabled
                    ? t('teams.actions.enable', { defaultValue: 'Enable Team' })
                    : t('teams.actions.disable', {
                        defaultValue: 'Disable Team',
                      })}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirmAction('delete')
                  }}
                >
                  <Trash2Icon className="w-4 h-4" />
                  {t('teams.actions.delete', { defaultValue: 'Delete Team' })}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('teams.dangerZone.description', {
                  defaultValue:
                    'Disabling a team blocks team-scoped access. Deleting a team permanently removes related team data.',
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        title={t(
          confirmAction === 'delete'
            ? 'teams.confirm.deleteTitle'
            : confirmAction === 'disable'
              ? 'teams.confirm.disableTitle'
              : 'teams.confirm.enableTitle',
          {
            defaultValue:
              confirmAction === 'delete'
                ? 'Delete Team'
                : confirmAction === 'disable'
                  ? 'Disable Team'
                  : 'Enable Team',
          }
        )}
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
          }
        }}
        footer={
          <DialogFooter
            onCancel={() => {
              setConfirmAction(null)
            }}
            onOk={() => {
              if (confirmAction === 'delete') {
                return onDeleteTeam()
              }
              if (confirmAction === 'disable') {
                return onSetTeamDisabled(true)
              }
              if (confirmAction === 'enable') {
                return onSetTeamDisabled(false)
              }
            }}
            okText={t(
              confirmAction === 'delete'
                ? 'teams.actions.delete'
                : confirmAction === 'disable'
                  ? 'teams.actions.disable'
                  : 'teams.actions.enable',
              {
                defaultValue:
                  confirmAction === 'delete'
                    ? 'Delete Team'
                    : confirmAction === 'disable'
                      ? 'Disable Team'
                      : 'Enable Team',
              }
            )}
            okButtonProps={{
              variant: confirmAction === 'delete' ? 'danger' : 'outline',
            }}
          />
        }
      >
        {confirmAction === 'delete'
          ? t('teams.confirm.deleteDescription', {
              defaultValue:
                'This will permanently delete the team and related records. This action cannot be undone.',
            })
          : confirmAction === 'disable'
            ? t('teams.confirm.disableDescription', {
                defaultValue:
                  'Disabling a team will block all team-scoped access until it is enabled again.',
              })
            : t('teams.confirm.enableDescription', {
                defaultValue:
                  'Enabling the team will restore team-scoped access for its members.',
              })}
      </Dialog>

      <TeamRechargeModal
        open={rechargeOpen && Boolean(selectedTeam)}
        onOpenChange={setRechargeOpen}
        team={selectedTeam}
        onSuccess={(team) => {
          syncSelectedTeam(team)
          refreshTeams()
        }}
      />
    </PageContainer>
  )
}

export default Page
