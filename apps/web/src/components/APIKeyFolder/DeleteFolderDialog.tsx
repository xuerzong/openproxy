import { cloneElement, useEffect, useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Checkbox } from '@openproxy/ui/Checkbox'
import { useTranslation } from 'react-i18next'
import { useRequest } from '@/contexts/ApiContext'
import { useApiKeysQuery } from '@/apps/tenant/hooks/queries/useApiKeysQuery'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface DeleteFolderDialogProps {
  trigger?: React.ReactElement<{ onClick?: () => void }>
  folderId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  trigger,
  folderId,
  open: controlledOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const apiKeysQuery = useApiKeysQuery()
  const foldersQuery = useApiKeyFoldersQuery()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [deleteAllApiKeys, setDeleteAllApiKeys] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const currentFolderApiKeyCount = (apiKeysQuery.data || []).filter(
    (apiKey) => apiKey.folderId === folderId
  ).length

  useEffect(() => {
    if (!open) {
      setDeleteAllApiKeys(false)
    }
  }, [open])

  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen)

    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
  }

  return (
    <>
      {trigger ? cloneElement(trigger, { onClick: () => setOpen(true) }) : null}

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
                request.apiKeyFolders({ id: folderId }).delete({
                  query: { deleteAllApiKeys },
                }),
                {
                  loading: t('common.processing'),
                  success: t('folders.deleteSuccess'),
                  error: (error) =>
                    t('common.operationFailedWithStatus', {
                      status: getToastRequestStatus(error),
                    }),
                  onSuccess: () => {
                    setOpen(false)
                    void apiKeysQuery.refetch()
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
        <div className="flex flex-col gap-3">
          <div>{t('folders.deleteWarning')}</div>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {apiKeysQuery.isLoading
              ? t('folders.apiKeyCountLoading')
              : t('folders.apiKeyCountLabel', {
                  count: currentFolderApiKeyCount,
                })}
          </div>
          <Checkbox
            checked={deleteAllApiKeys}
            onCheckedChange={(checked) => {
              setDeleteAllApiKeys(checked === true)
            }}
            label={t('folders.deleteAllApiKeys')}
          />
          {deleteAllApiKeys && (
            <div className="flex flex-col gap-2 rounded-md border border-danger/20 bg-danger/5 p-3">
              <div className="text-sm font-medium text-danger">
                {t('folders.deleteAllApiKeysDangerTitle')}
              </div>
              <div className="text-xs leading-5 text-danger/90">
                {t('folders.deleteAllApiKeysDangerDescription', {
                  count: currentFolderApiKeyCount,
                })}
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}
