import { useRequest } from '@/contexts/ApiContext'
import { Dialog, DialogFooter } from '../ui/Dialog'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
          okButtonProps={{
            variant: 'danger',
          }}
          okText={t('actions.confirmDelete', {
            defaultValue: 'Confirm delete',
          })}
          onOk={() =>
            request
              .aiProviders({ id })
              .delete()
              .then((res) => {
                if (res.error) {
                  toast.error(
                    t('common.operationFailedWithStatus', {
                      defaultValue: `Operation failed: ${res.error.status}`,
                      status: res.error.status,
                    })
                  )
                  return
                }
                toast.success(
                  t('common.operationSuccess', { defaultValue: 'Success' })
                )
                onSuccess?.()
                onOpenChange(false)
                return
              })
          }
        />
      }
    >
      {t('aiProviders.deleteConfirm', {
        defaultValue: 'Are you sure you want to delete this provider?',
      })}
    </Dialog>
  )
}
