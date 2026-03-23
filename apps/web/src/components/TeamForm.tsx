import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Form, FormField, useForm } from '@openproxy/ui/Form'
import { Input } from '@openproxy/ui/Input'
import { useRequest } from '@/contexts/ApiContext'
import { changeActiveTeam } from '@/utils/better-auth'
import { useAuth } from '@/contexts/AuthContext'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import { queryKeys } from '@/constants/query-keys'

interface TeamFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const TeamForm: React.FC<TeamFormProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const queryClient = useQueryClient()
  const { refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form] = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      name: async (value: string) =>
        !value.trim()
          ? {
              success: false as const,
              message: t('team.nameRequired', {
                defaultValue: 'Team name is required',
              }),
            }
          : { success: true as const },
    },
  })

  useEffect(() => {
    if (!open) {
      form.resetValues()
      form.resetErrors()
      setLoading(false)
    }
  }, [open])

  const onClose = () => {
    onOpenChange(false)
  }

  const onSubmit = () => {
    form.onSubmit(async (values) => {
      setLoading(true)

      void toastApiPromise(request.team.post({ name: values.name.trim() }), {
        loading: t('common.processing', { defaultValue: 'Processing...' }),
        success: t('common.operationSuccess', { defaultValue: 'Success' }),
        error: (error) => {
          const status = getToastRequestStatus(error)
          if (status === 409) {
            return t('team.limitReached', {
              defaultValue: 'You have reached the maximum number of teams.',
            })
          }
          return t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${status}`,
            status,
          })
        },
        onSuccess: async (data) => {
          if (data && typeof data === 'object' && 'teamId' in data) {
            await changeActiveTeam((data as { teamId: string }).teamId)
            await refreshSession()
          }
          await queryClient.invalidateQueries({ queryKey: [queryKeys.teams] })
          await queryClient.invalidateQueries({ queryKey: [queryKeys.team] })
          onClose()
        },
      }).finally(() => {
        setLoading(false)
      })
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      title={t('team.create', { defaultValue: 'Create Team' })}
      description={t('team.createDescription', {
        defaultValue: 'Create a new team to organize your workspace.',
      })}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
          }}
          onCancel={onClose}
          onOk={onSubmit}
          okButtonProps={{
            loading,
            disabled: !form.values.name.trim(),
          }}
        />
      }
    >
      <Form form={form}>
        <FormField
          name="name"
          label={t('team.nameLabel', { defaultValue: 'Team Name' })}
          requiredMask
        >
          <Input
            placeholder={t('team.namePlaceholder', {
              defaultValue: 'Enter team name',
            })}
            maxLength={50}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSubmit()
              }
            }}
          />
        </FormField>
      </Form>
    </Dialog>
  )
}
