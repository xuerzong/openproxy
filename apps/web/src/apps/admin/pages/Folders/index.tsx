import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderIcon, StarIcon, Trash2Icon, SearchIcon } from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { Button } from '@openproxy/ui/Button'
import { Input } from '@openproxy/ui/Input'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Table } from '@openproxy/ui/Table'
import { useAdminApiKeyFoldersQuery } from '@/apps/admin/hooks/queries/useAdminApiKeyFoldersQuery'
import { useRequest } from '@/contexts/ApiContext'
import dayjs from '@/utils/dayjs'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [teamId, setTeamId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const foldersQuery = useAdminApiKeyFoldersQuery({ teamId })

  return (
    <PageContainer title={t('folders.adminTitle')} className="h-screen">
      <div className="flex items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder={t('folders.teamIdPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setTeamId(searchInput.trim())
          }}
        />
        <Button onClick={() => setTeamId(searchInput.trim())}>
          <SearchIcon className="w-4 h-4" />
          {t('folders.search')}
        </Button>
      </div>

      {teamId && (
        <FlexScrollViewer bordered>
          <Table
            rowKey={(folder: any) => folder.id}
            data={foldersQuery.data || []}
            columns={[
              {
                key: 'name',
                label: t('common.name'),
                width: 200,
                render: (text: string) => (
                  <div className="flex items-center gap-2">
                    <FolderIcon className="w-4 h-4 text-muted-foreground" />
                    {text}
                  </div>
                ),
              },
              {
                key: 'isDefault',
                label: t('folders.default'),
                width: 100,
                align: 'center' as const,
                render: (val: boolean) =>
                  val ? (
                    <StarIcon className="w-4 h-4 text-amber-500 mx-auto" />
                  ) : (
                    '-'
                  ),
              },
              {
                key: 'createdAt',
                label: t('folders.createdAt'),
                width: 200,
                render: (text: string) =>
                  dayjs(text).format('YYYY-MM-DD HH:mm'),
              },
              {
                key: 'updatedAt',
                label: t('folders.updatedAt'),
                width: 200,
                render: (text: string) =>
                  dayjs(text).format('YYYY-MM-DD HH:mm'),
              },
              {
                key: 'operation',
                label: t('common.operation'),
                width: 100,
                render: (_: any, row: any) => (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteId(row.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                ),
              },
            ]}
          />
        </FlexScrollViewer>
      )}

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
                request.admin.folders({ id: deleteId }).delete(),
                {
                  loading: t('common.processing'),
                  success: t('folders.deleteSuccess'),
                  error: (error: any) =>
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
        <div>{t('folders.adminDeleteWarning')}</div>
      </Dialog>
    </PageContainer>
  )
}

export default Page
