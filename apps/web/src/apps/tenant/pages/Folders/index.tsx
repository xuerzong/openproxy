import { useState } from 'react'
import { useRequest } from '@/contexts/ApiContext'
import { toast } from 'sonner'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { Button } from '@openproxy/ui/Button'
import { FolderIcon, PlusIcon, StarIcon } from 'lucide-react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import { Switch } from '@openproxy/ui/Switch'

const Page = () => {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [deleteId, setDeleteId] = useState('')
  const request = useRequest()
  const foldersQuery = useApiKeyFoldersQuery()

  const isEdit = Boolean(editId)

  const resetForm = () => {
    setEditId('')
    setName('')
    setIsDefault(false)
  }

  return (
    <PageContainer title={t('folders.title')} className="h-screen">
      <div className="flex items-center w-full gap-2">
        <div style={{ flex: 1 }}></div>
        <Button
          onClick={() => {
            resetForm()
            setOpen(true)
          }}
        >
          <PlusIcon />
          {t('folders.create')}
        </Button>
      </div>
      <FlexScrollViewer bordered>
        {foldersQuery.data &&
          foldersQuery.data.map((folder, idx) => (
            <div key={folder.id}>
              <div className="flex items-center gap-3 p-4">
                <FolderIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{folder.name}</span>
                    {folder.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                        <StarIcon className="w-3 h-3" />
                        {t('folders.default')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditId(folder.id)
                      setName(folder.name)
                      setIsDefault(folder.isDefault)
                      setOpen(true)
                    }}
                  >
                    {t('actions.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(folder.id)}
                  >
                    {t('actions.delete')}
                  </Button>
                </div>
              </div>
              {idx !== foldersQuery.data!.length - 1 && (
                <div className="h-px bg-border w-full" />
              )}
            </div>
          ))}
        {foldersQuery.data && foldersQuery.data.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <div className="text-muted-foreground">
              {t('common.emptyState')}
            </div>
            <Button
              onClick={() => {
                resetForm()
                setOpen(true)
              }}
            >
              <PlusIcon />
              {t('actions.createNow')}
            </Button>
          </div>
        )}
      </FlexScrollViewer>

      <Dialog
        open={open}
        title={isEdit ? t('folders.editTitle') : t('folders.createTitle')}
        onOpenChange={(open) => {
          setOpen(open)
          if (!open) resetForm()
        }}
        footer={
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  toast.error(t('common.pleaseInput'))
                  return
                }
                const resp = isEdit
                  ? request.apiKeyFolders.put({
                      id: editId,
                      name: name.trim(),
                      isDefault,
                    })
                  : request.apiKeyFolders.post({
                      name: name.trim(),
                      isDefault,
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
                    setOpen(false)
                    resetForm()
                  },
                })
              }}
            >
              {isEdit
                ? t('actions.confirmChanges')
                : t('actions.confirmCreate')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('folders.nameLabel')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('folders.namePlaceholder')}
              maxLength={32}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {t('folders.setDefault')}
            </label>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId('')
        }}
        title={t('actions.confirmDelete')}
        footer={
          <DialogFooter
            okText={t('actions.confirmDelete')}
            okButtonProps={{ variant: 'danger' }}
            onOk={() => {
              void toastApiPromise(
                request.apiKeyFolders({ id: deleteId }).delete(),
                {
                  loading: t('common.processing'),
                  success: t('folders.deleteSuccess'),
                  error: (error) =>
                    t('common.operationFailedWithStatus', {
                      status: getToastRequestStatus(error),
                    }),
                  onSuccess: () => {
                    setDeleteId('')
                    void foldersQuery.refetch()
                  },
                }
              )
            }}
            cancelText={t('actions.cancel')}
            onCancel={() => setDeleteId('')}
          />
        }
      >
        <div>{t('folders.deleteWarning')}</div>
      </Dialog>
    </PageContainer>
  )
}

export default Page
