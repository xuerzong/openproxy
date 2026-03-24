import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { Button } from '@openproxy/ui/Button'
import { FolderIcon, PlusIcon, StarIcon } from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'
import { EditFolderDialog } from '@/components/APIKeyFolder/EditFolderDialog'
import { DeleteFolderDialog } from '@/components/APIKeyFolder/DeleteFolderDialog'

const Page = () => {
  const { t } = useTranslation('common')
  const foldersQuery = useApiKeyFoldersQuery()

  return (
    <PageContainer title={t('folders.title')} className="h-screen">
      <div className="flex items-center w-full gap-2">
        <div style={{ flex: 1 }}></div>
        <EditFolderDialog
          trigger={
            <Button>
              <PlusIcon />
              {t('folders.create')}
            </Button>
          }
        />
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
                  <EditFolderDialog
                    folderId={folder.id}
                    defaultValues={{
                      name: folder.name,
                      isDefault: folder.isDefault,
                    }}
                    trigger={
                      <Button variant="outline" size="sm">
                        {t('actions.edit')}
                      </Button>
                    }
                  />
                  <DeleteFolderDialog
                    folderId={folder.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        {t('actions.delete')}
                      </Button>
                    }
                  />
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
            <EditFolderDialog
              trigger={
                <Button>
                  <PlusIcon />
                  {t('actions.createNow')}
                </Button>
              }
            />
          </div>
        )}
      </FlexScrollViewer>
    </PageContainer>
  )
}

export default Page
