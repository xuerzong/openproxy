import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { CopyButton } from '@/components/CopyButton'
import { useTeamMembersQuery } from '@/apps/tenant/hooks/queries/useTeamMembersQuery'
import { useTeamsQuery } from '@/apps/tenant/hooks/queries/useTeamsQuery'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Tag } from '@/components/ui/Tag'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRequest } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { changeActiveTeam } from '@/utils/better-auth'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshSession, session } = useAuth()
  const teamQuery = useTeamQuery()
  const teamMembersQuery = useTeamMembersQuery()
  const teamsQuery = useTeamsQuery()
  const [name, setName] = useState('')
  const [allowJoin, setAllowJoin] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingAllowJoin, setUpdatingAllowJoin] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const team = teamQuery.data?.team
  const members = teamMembersQuery.data || []
  const teams = teamsQuery.data || []
  const currentUserId = session?.user.id
  const currentMember = members.find(
    (member) => member.userId === currentUserId
  )
  const isOwner = currentMember?.role === 'owner'
  const hasAnotherTeam = teams.length > 1
  const deleteGuardReady = !teamMembersQuery.isLoading && !teamsQuery.isLoading
  const canDeleteTeam = Boolean(deleteGuardReady && isOwner && hasAnotherTeam)
  const deleteBlockedReason = !deleteGuardReady
    ? ''
    : !isOwner
      ? t('teamSettings.messages.deleteRequiresOwner', {
          defaultValue: 'Only team owners can delete the current team.',
        })
      : !hasAnotherTeam
        ? t('teamSettings.messages.deleteRequiresAnotherTeam', {
            defaultValue:
              'You must keep at least one team in your account before deleting this one.',
          })
        : ''
  const inviteLink = useMemo(() => {
    if (!team?.inviteCode) {
      return ''
    }

    return `${window.location.origin}/join/${team.inviteCode}`
  }, [team?.inviteCode])

  useEffect(() => {
    setName(team?.name || '')
  }, [team?.name])

  useEffect(() => {
    setAllowJoin(team?.allowJoin !== false)
  }, [team?.allowJoin])

  const hasNameChanges = name.trim() !== (team?.name || '').trim()

  const refreshTeamState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['team'] }),
      queryClient.invalidateQueries({ queryKey: ['teams'] }),
      queryClient.invalidateQueries({ queryKey: ['team-members'] }),
    ])
  }

  const onSave = async () => {
    if (!name.trim() || saving) {
      return
    }

    setSaving(true)
    const response = await request.team.put({
      name: name.trim(),
      allowJoin,
    })
    setSaving(false)

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
      t('teamSettings.messages.updateSuccess', {
        defaultValue: 'Team information updated successfully',
      })
    )
    await refreshTeamState()
  }

  const onChangeAllowJoin = async (checked: boolean) => {
    if (!team || updatingAllowJoin) {
      return
    }

    const nextAllowJoin = Boolean(checked)
    const previousAllowJoin = allowJoin

    if (nextAllowJoin === previousAllowJoin) {
      return
    }

    setAllowJoin(nextAllowJoin)
    setUpdatingAllowJoin(true)

    const response = await request.team.put({
      name: team.name,
      allowJoin: nextAllowJoin,
    })

    setUpdatingAllowJoin(false)

    if (response.error) {
      setAllowJoin(previousAllowJoin)
      toast.error(
        t('common.operationFailedWithStatus', {
          defaultValue: `Operation failed: ${response.error.status}`,
          status: response.error.status,
        })
      )
      return
    }

    toast.success(
      t('teamSettings.messages.updateSuccess', {
        defaultValue: 'Team information updated successfully',
      })
    )
    await refreshTeamState()
  }

  const onDelete = async () => {
    if (deleting || !canDeleteTeam) {
      if (!canDeleteTeam && deleteBlockedReason) {
        toast.error(deleteBlockedReason)
      }
      return
    }

    setDeleting(true)
    const response = await request.team.delete()

    const errorValue = response.error?.value as
      | string
      | { message?: string; code?: string; reason?: string }
      | null

    const errorReason =
      typeof errorValue === 'string'
        ? errorValue
        : errorValue?.reason || errorValue?.message || errorValue?.code || ''

    if (response.error) {
      setDeleting(false)
      toast.error(
        errorReason === 'ONLY_OWNER'
          ? t('teamSettings.messages.deleteRequiresOwner', {
              defaultValue: 'Only team owners can delete the current team.',
            })
          : errorReason === 'LAST_TEAM'
            ? t('teamSettings.messages.deleteRequiresAnotherTeam', {
                defaultValue:
                  'You must keep at least one team in your account before deleting this one.',
              })
            : t('common.operationFailedWithStatus', {
                defaultValue: `Operation failed: ${response.error.status}`,
                status: response.error.status,
              })
      )
      return
    }

    if (typeof response.data === 'string') {
      setDeleting(false)
      toast.error(
        t('common.operationFailed', {
          defaultValue: 'Operation failed',
        })
      )
      return
    }

    await changeActiveTeam(response.data.nextTeamId)
    await refreshSession()
    await refreshTeamState()
    setDeleting(false)
    setDeleteDialogOpen(false)
    toast.success(
      t('teamSettings.messages.deleteSuccess', {
        defaultValue: 'Team deleted successfully',
      })
    )
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-6">
        <div>
          <div className="text-lg font-semibold">
            {t('teamSettings.general.basicInfo', {
              defaultValue: 'Basic Information',
            })}
          </div>
          <div className="text-sm text-secondary mt-1">
            {t('teamSettings.general.basicInfoDescription', {
              defaultValue:
                'Update the current team name and review the active invitation link.',
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('common.id', { defaultValue: 'ID' })}
            </label>
            <Input value={team?.id || ''} disabled />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              {t('teamSettings.general.memberQuota', {
                defaultValue: 'Member Quota',
              })}
            </label>
            <div className="h-10 px-3 rounded-md border border-border flex items-center justify-between gap-2 bg-muted/40">
              <span>
                {team?.usersLimit || 0}{' '}
                {t('teamSettings.general.seats', { defaultValue: 'seats' })}
              </span>
              <Tag color={allowJoin ? 'green' : 'yellow'}>
                {allowJoin
                  ? t('teamSettings.general.inviteEnabled', {
                      defaultValue: 'Invite enabled',
                    })
                  : t('teamSettings.general.inviteDisabled', {
                      defaultValue: 'Join disabled',
                    })}
              </Tag>
            </div>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="font-medium text-sm">
              {t('teamSettings.general.allowJoin', {
                defaultValue: 'Allow users to join via invite link',
              })}
            </label>
            <div className="min-h-10 px-3 py-2 rounded-md border border-border flex items-center justify-between gap-3 bg-muted/20">
              <div className="text-sm text-secondary">
                {allowJoin
                  ? t('teamSettings.general.allowJoinEnabled', {
                      defaultValue:
                        'Users with a valid invite link can join this team.',
                    })
                  : t('teamSettings.general.allowJoinDisabled', {
                      defaultValue:
                        'New users cannot join this team through invite links right now.',
                    })}
              </div>
              <Switch
                checked={allowJoin}
                disabled={!team || updatingAllowJoin}
                onCheckedChange={onChangeAllowJoin}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="font-medium text-sm">
              {t('common.name', { defaultValue: 'Name' })}
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                className="w-full"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                }}
                placeholder={t('teamSettings.general.namePlaceholder', {
                  defaultValue: 'Please input team name',
                })}
              />
              <Button
                loading={saving}
                disabled={!name.trim() || !hasNameChanges}
                onClick={onSave}
              >
                {t('actions.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="font-medium text-sm">
              {t('teamSettings.general.inviteLink', {
                defaultValue: 'Invite Link',
              })}
            </label>
            <Input
              value={inviteLink || '-'}
              readOnly
              suffix={inviteLink ? <CopyButton text={inviteLink} /> : null}
            />
          </div>
        </div>
      </Card>

      <Card className="border-danger/30 bg-danger/5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <div className="text-lg font-semibold text-danger">
              {t('teamSettings.dangerZone.title', {
                defaultValue: 'Danger Zone',
              })}
            </div>
            <div className="text-sm text-secondary mt-1">
              {t('teamSettings.dangerZone.description', {
                defaultValue:
                  'Deleting the team will remove the workspace for all members. This action cannot be undone.',
              })}
            </div>
          </div>
        </div>

        <div>
          {canDeleteTeam ? (
            <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2Icon className="w-4 h-4" />
              {t('teamSettings.actions.deleteTeam', {
                defaultValue: 'Delete Team',
              })}
            </Button>
          ) : !deleteBlockedReason ? (
            <Button variant="danger" disabled>
              <Trash2Icon className="w-4 h-4" />
              {t('teamSettings.actions.deleteTeam', {
                defaultValue: 'Delete Team',
              })}
            </Button>
          ) : (
            <Tooltip content={deleteBlockedReason}>
              <span className="inline-flex">
                <Button variant="danger" disabled>
                  <Trash2Icon className="w-4 h-4" />
                  {t('teamSettings.actions.deleteTeam', {
                    defaultValue: 'Delete Team',
                  })}
                </Button>
              </span>
            </Tooltip>
          )}
        </div>
      </Card>

      <Dialog
        title={t('teamSettings.confirmDelete.title', {
          defaultValue: 'Delete current team?',
        })}
        description={t('teamSettings.confirmDelete.description', {
          defaultValue:
            'This will remove the current team and all team-scoped data for every member.',
        })}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        footer={
          <DialogFooter
            okText={t('teamSettings.actions.deleteTeam', {
              defaultValue: 'Delete Team',
            })}
            okButtonProps={{
              variant: 'danger',
              loading: deleting,
              disabled: !canDeleteTeam,
            }}
            onCancel={() => setDeleteDialogOpen(false)}
            onOk={onDelete}
          />
        }
      />
    </div>
  )
}

export default Page
