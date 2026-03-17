import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeftIcon, RefreshCcwIcon, Trash2Icon } from 'lucide-react'
import { TeamRechargeModal } from '../TeamRechargeModal'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@openproxy/ui/Button'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Form, FormField, useForm } from '@openproxy/ui/Form'
import { Input, Textarea } from '@openproxy/ui/Input'
import { Loader } from '@openproxy/ui/Loader'
import { NumberInput } from '@openproxy/ui/NumberInput'
import { Switch } from '@openproxy/ui/Switch'
import { Tag } from '@openproxy/ui/Tag'
import { Table } from '@openproxy/ui/Table'
import { useAdminTeamMembersQuery } from '@/apps/admin/hooks/queries/useAdminTeamMembersQuery'
import { useAdminTeamQuery } from '@/apps/admin/hooks/queries/useAdminTeamQuery'
import { NotFoundView } from '@/components/NotFoundView'
import { useRequest } from '@/contexts/ApiContext'
import dayjs from '@/utils/dayjs'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const params = useParams()
  const request = useRequest()
  const teamId = params.id || ''
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    null | 'delete' | 'disable' | 'enable'
  >(null)
  const teamQuery = useAdminTeamQuery({ teamId })
  const teamMembersQuery = useAdminTeamMembersQuery({ teamId })
  const team =
    teamQuery.data && typeof teamQuery.data !== 'string' ? teamQuery.data : null
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

  const syncTeamForm = (team: any) => {
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

  useEffect(() => {
    if (!team) {
      return
    }

    syncTeamForm(team)
  }, [team])

  const refreshTeam = () => {
    teamQuery.refetch()
    teamMembersQuery.refetch()
  }

  const syncTeam = (team: any) => {
    syncTeamForm(team)
  }

  const onUpdateTeam = () => {
    teamForm.onSubmit(async (values) => {
      void toastApiPromise(request.admin.teams.put(values), {
        loading: t('common.processing', {
          defaultValue: 'Processing...',
        }),
        success: t('teams.messages.updateSuccess', {
          defaultValue: 'Team updated successfully',
        }),
        error: (error) =>
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
            status: getToastRequestStatus(error),
          }),
        onSuccess: (data) => {
          syncTeam(data)
          refreshTeam()
        },
      })
    })
  }

  const onResetInviteCode = async () => {
    if (!team) {
      return
    }

    void toastApiPromise(
      request.admin.teams.resetInviteCode.post({
        id: team.id,
      }),
      {
        loading: t('common.processing', {
          defaultValue: 'Processing...',
        }),
        success: t('teams.messages.inviteCodeReset', {
          defaultValue: 'Invite code reset successfully',
        }),
        error: (error) =>
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
            status: getToastRequestStatus(error),
          }),
        onSuccess: (data) => {
          syncTeam(data)
          refreshTeam()
        },
      }
    )
  }

  const onSetTeamDisabled = async (disabled: boolean) => {
    if (!team) {
      return
    }

    void toastApiPromise(
      request.admin.teams.status.put({
        id: team.id,
        disabled,
      }),
      {
        loading: t('common.processing', {
          defaultValue: 'Processing...',
        }),
        success: t(
          disabled
            ? 'teams.messages.disabledSuccess'
            : 'teams.messages.enabledSuccess',
          {
            defaultValue: disabled
              ? 'Team disabled successfully'
              : 'Team enabled successfully',
          }
        ),
        error: (error) =>
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
            status: getToastRequestStatus(error),
          }),
        onSuccess: (data) => {
          syncTeam(data)
          refreshTeam()
          setConfirmAction(null)
        },
      }
    )
  }

  const onDeleteTeam = async () => {
    if (!team) {
      return
    }

    void toastApiPromise(request.admin.teams({ id: team.id }).delete(), {
      loading: t('common.processing', {
        defaultValue: 'Processing...',
      }),
      success: t('teams.messages.deleteSuccess', {
        defaultValue: 'Team deleted successfully',
      }),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        navigate('/teams')
      },
    })
  }

  if (teamQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-primary">
        <Loader />
      </div>
    )
  }

  if (!team) {
    return <NotFoundView />
  }

  return (
    <PageContainer
      title={t('teams.detailTitle', { defaultValue: 'Team Details' })}
    >
      <div className="shrink-0 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => {
            navigate('/teams')
          }}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {t('common.back', { defaultValue: 'Back' })}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setRechargeOpen(true)
            }}
          >
            {t('teams.actions.recharge', { defaultValue: 'Recharge' })}
          </Button>
          <Button onClick={onUpdateTeam}>
            {t('actions.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">
              {t('common.id', { defaultValue: 'ID' })}
            </div>
            <div className="break-all">{team.id}</div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.inviteCode', { defaultValue: 'Invite Code' })}
            </div>
            <div className="flex items-center gap-2">
              <span>{team.inviteCode}</span>
              {team.disabled ? (
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
            <div>{team.memberCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.amount', { defaultValue: 'Balance' })}
            </div>
            <div>{team.amount}</div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.createdAt', { defaultValue: 'Created At' })}
            </div>
            <div>{dayjs(team.createdAt).format('YYYY/MM/DD HH:mm:ss')}</div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.updatedAt', { defaultValue: 'Updated At' })}
            </div>
            <div>{dayjs(team.updatedAt).format('YYYY/MM/DD HH:mm:ss')}</div>
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
                <span className="text-sm text-primary/75">
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
                  label: t('teams.members.email', { defaultValue: 'Email' }),
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
              locale={{
                noData: t('common.noData', { defaultValue: 'No data' }),
                emptyListHint: t('common.emptyListHint', {
                  defaultValue: 'No records yet',
                }),
              }}
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
                setConfirmAction(team.disabled ? 'enable' : 'disable')
              }}
            >
              {team.disabled
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
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
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
        open={rechargeOpen}
        onOpenChange={setRechargeOpen}
        team={team}
        onSuccess={(nextTeam) => {
          syncTeam(nextTeam)
          refreshTeam()
        }}
      />
    </PageContainer>
  )
}

export default Page
