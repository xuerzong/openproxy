import { useRequest } from '@/contexts/ApiContext'
import { useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface ModelDeleteModal {
  id?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export const ModelDeleteModal: React.FC<ModelDeleteModal> = ({
  id,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [value, setValue] = useState('')
  return (
    <Dialog
      title={t('models.confirmDeleteTitle', {
        defaultValue: 'Confirm delete model',
      })}
      open={open}
      onOpenChange={onOpenChange}
      overlayProps={{ className: 'z-1000' }}
      contentProps={{ className: 'z-1000' }}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
          }}
          onCancel={() => {
            onOpenChange?.(false)
          }}
          okText={t('actions.confirmDelete', {
            defaultValue: 'Confirm delete',
          })}
          okButtonProps={{
            variant: 'danger',
            disabled: value !== id,
          }}
          onOk={() => {
            if (!id) return
            toastApiPromise(request.models.delete({ id }), {
              loading: t('common.processing', {
                defaultValue: 'Processing...',
              }),
              success: t('common.operationSuccess', {
                defaultValue: 'Success',
              }),
              error: (error) =>
                t('common.operationFailedWithStatus', {
                  defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                  status: getToastRequestStatus(error),
                }),
              onSuccess: () => {
                onOpenChange?.(false)
                setValue('')
                onSuccess?.()
              },
            })
          }}
        />
      }
    >
      <div className="flex flex-col gap-1">
        <div>
          {t('models.deleteWarning', {
            defaultValue:
              'Are you sure to delete this model? Existing features may be affected. Please proceed with caution.',
          })}
        </div>
        <div>
          {t('models.deleteInputPrefix', {
            defaultValue: 'Please enter model ID',
          })}
          <span className="text-sm text-primary bg-primary/10 border border-border px-1 mx-1 rounded-sm">
            {id}
          </span>
          {t('models.deleteInputSuffix', {
            defaultValue: 'to confirm model deletion',
          })}
        </div>
        <Input
          value={value}
          placeholder={t('models.deletePlaceholder', {
            defaultValue: 'Please input model ID to delete',
          })}
          onChange={(e) => {
            setValue(e.target.value)
          }}
        />
      </div>
    </Dialog>
  )
}
