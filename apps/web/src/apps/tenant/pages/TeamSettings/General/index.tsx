import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/Card'
import { CopyButton } from '@/components/CopyButton'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { useRequest } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { changeActiveTeam } from '@/utils/better-auth'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshSession } = useAuth()
  const teamQuery = useTeamQuery()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const team = teamQuery.data?.team
  const inviteLink = useMemo(() => {
    if (!team?.inviteCode) {
      return ''
    }

    return `${window.location.origin}/join/${team.inviteCode}`
  }, [team?.inviteCode])

  useEffect(() => {
    setName(team?.name || '')
  }, [team?.name])

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

  const onDelete = async () => {
    if (deleting) {
      return
    }

    setDeleting(true)
    const response = await request.team.delete()

    if (response.error) {
      setDeleting(false)
      toast.error(
        t('common.operationFailedWithStatus', {
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
            <div className="h-9 px-3 rounded-md border border-border flex items-center justify-between gap-2 bg-muted/40">
              <span>
                {team?.usersLimit || 0}{' '}
                {t('teamSettings.general.seats', { defaultValue: 'seats' })}
              </span>
              <Tag color="green">
                {t('teamSettings.general.inviteEnabled', {
                  defaultValue: 'Invite enabled',
                })}
              </Tag>
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
                disabled={!name.trim() || name.trim() === (team?.name || '').trim()}
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
            <div className="min-h-9 px-3 py-2 rounded-md border border-border flex items-start gap-3 bg-muted/20 break-all">
              <span className="flex-1 text-sm">{inviteLink || '-'}</span>
              {inviteLink ? <CopyButton text={inviteLink} /> : null}
            </div>
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
          <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2Icon className="w-4 h-4" />
            {t('teamSettings.actions.deleteTeam', {
              defaultValue: 'Delete Team',
            })}
          </Button>
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