import { useRequest } from '@/contexts/ApiContext'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface AIProviderDeleteModalProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const AIProviderDeleteModal: React.FC<AIProviderDeleteModalProps> = ({
  id,
  onSuccess,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  return (
    <Dialog
      title={t('actions.confirmDelete', { defaultValue: 'Confirm delete' })}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
          }}
          okButtonProps={{
            variant: 'danger',
          }}
          okText={t('actions.confirmDelete', {
            defaultValue: 'Confirm delete',
          })}
          onOk={() => {
            toastApiPromise(request.aiProviders({ id }).delete(), {
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
                onSuccess?.()
                onOpenChange(false)
              },
            })
          }}
        />
      }
    >
      {t('aiProviders.deleteConfirm', {
        defaultValue: 'Are you sure you want to delete this provider?',
      })}
    </Dialog>
  )
}
