import { cloneElement, useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { useTranslation } from 'react-i18next'
import { useRequest } from '@/contexts/ApiContext'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface DeleteFolderDialogProps {
  trigger: React.ReactElement<{ onClick?: () => void }>
  folderId: string
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  trigger,
  folderId,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const foldersQuery = useApiKeyFoldersQuery()
  const [open, setOpen] = useState(false)

  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setOpen(false)
        }}
        title={t('actions.confirmDelete')}
        footer={
          <DialogFooter
            okText={t('actions.confirmDelete')}
            okButtonProps={{ variant: 'danger' }}
            onOk={() => {
              void toastApiPromise(
                request.apiKeyFolders({ id: folderId }).delete(),
                {
                  loading: t('common.processing'),
                  success: t('folders.deleteSuccess'),
                  error: (error) =>
                    t('common.operationFailedWithStatus', {
                      status: getToastRequestStatus(error),
                    }),
                  onSuccess: () => {
                    setOpen(false)
                    void foldersQuery.refetch()
                  },
                }
              )
            }}
            cancelText={t('actions.cancel')}
            onCancel={() => setOpen(false)}
          />
        }
      >
        <div>{t('folders.deleteWarning')}</div>
      </Dialog>
    </>
  )
}
