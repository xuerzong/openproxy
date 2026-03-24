import { useState } from 'react'
import { cloneElement } from 'react'
import { Dialog } from '@openproxy/ui/Dialog'
import { useForm } from '@openproxy/ui/Form'
import { Button } from '@openproxy/ui/Button'
import { useTranslation } from 'react-i18next'
import { useRequest } from '@/contexts/ApiContext'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import { FolderForm } from './FolderForm'

interface EditFolderDialogProps {
  trigger?: React.ReactElement<{ onClick?: () => void }>
  folderId?: string
  defaultValues?: { name: string; isDefault: boolean }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const EditFolderDialog: React.FC<EditFolderDialogProps> = ({
  trigger,
  folderId,
  defaultValues,
  open: controlledOpen,
  onOpenChange,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const foldersQuery = useApiKeyFoldersQuery()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isEdit = Boolean(folderId)
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen)

    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen)
    }
  }

  const [form] = useForm({
    defaultValues: { name: '', isDefault: false },
  })

  const handleOpen = () => {
    form.setValues(defaultValues ?? { name: '', isDefault: false })
    form.resetErrors()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = () => {
    const { name, isDefault } = form.values
    if (!name?.trim()) {
      form.setFieldError('name', t('common.pleaseInput'))
      return
    }

    const resp = isEdit
      ? request.apiKeyFolders.put({
          id: folderId!,
          name: name.trim(),
          isDefault: isDefault ?? false,
        })
      : request.apiKeyFolders.post({
          name: name.trim(),
          isDefault: isDefault ?? false,
        })

    void toastApiPromise(resp, {
      loading: t('common.processing'),
      success: t('common.operationSuccess'),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        void foldersQuery.refetch()
        handleClose()
      },
    })
  }

  return (
    <>
      {trigger ? cloneElement(trigger, { onClick: handleOpen }) : null}

      <Dialog
        open={open}
        title={isEdit ? t('folders.editTitle') : t('folders.createTitle')}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
        footer={
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" onClick={handleClose}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleSubmit}>
              {isEdit
                ? t('actions.confirmChanges')
                : t('actions.confirmCreate')}
            </Button>
          </div>
        }
      >
        <FolderForm form={form} />
      </Dialog>
    </>
  )
}
