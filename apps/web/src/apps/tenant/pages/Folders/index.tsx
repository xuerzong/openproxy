import { useState } from 'react'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { Button } from '@openproxy/ui/Button'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { useIsOSS } from '@/hooks/useIsOSS'
import {
  FolderIcon,
  MoreHorizontalIcon,
  PenSquareIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'
import { EditFolderDialog } from '@/components/APIKeyFolder/EditFolderDialog'
import { DeleteFolderDialog } from '@/components/APIKeyFolder/DeleteFolderDialog'
import { DropdownMenu, type DropdownMenuItem } from '@openproxy/ui/DropdownMenu'

const Page = () => {
  const { t } = useTranslation('common')
  const foldersQuery = useApiKeyFoldersQuery()
  const teamQuery = useTeamQuery()
  const constsQuery = useConstsQuery()
  const isOSS = useIsOSS()
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)

  const folders = foldersQuery.data || []
  const teamPlanLimits = constsQuery.data?.teamPlanLimits
  const currentPlan = teamQuery.data?.team?.plan
  const folderLimit =
    currentPlan && teamPlanLimits && currentPlan in teamPlanLimits
      ? teamPlanLimits[currentPlan as keyof typeof teamPlanLimits].folderLimit
      : undefined
  const isCreateDisabled =
    !isOSS && !!folderLimit && folders.length >= folderLimit
  const totalFoldersLabel =
    isOSS || !folderLimit ? t('common.unlimited') : String(folderLimit)
  const createFolderLabel = t('folders.createWithQuota', {
    used: folders.length,
    total: totalFoldersLabel,
  })

  const editingFolder =
    editingFolderId == null
      ? null
      : folders.find((folder) => folder.id === editingFolderId) || null

  const deletingFolder =
    deletingFolderId == null
      ? null
      : folders.find((folder) => folder.id === deletingFolderId) || null

  const getFolderMenus = (
    folder: (typeof folders)[number]
  ): DropdownMenuItem[] => {
    const menus: DropdownMenuItem[] = [
      {
        type: 'item',
        key: 'edit',
        label: t('actions.edit'),
        icon: <PenSquareIcon />,
        onClick: () => setEditingFolderId(folder.id),
      },
    ]

    if (!folder.isDefault) {
      menus.push({
        type: 'item',
        key: 'delete',
        label: t('actions.delete'),
        icon: <Trash2Icon />,
        color: 'danger',
        onClick: () => setDeletingFolderId(folder.id),
      })
    }

    return menus
  }

  return (
    <PageContainer title={t('folders.title')} className="h-screen">
      <div className="flex w-full justify-end">
        <div className="flex items-center gap-2 self-end md:self-auto">
          <EditFolderDialog
            trigger={
              <Button disabled={isCreateDisabled}>
                <PlusIcon />
                {createFolderLabel}
              </Button>
            }
          />
        </div>
      </div>
      <FlexScrollViewer>
        <EditFolderDialog
          folderId={editingFolder?.id}
          defaultValues={
            editingFolder
              ? {
                  name: editingFolder.name,
                  isDefault: editingFolder.isDefault,
                }
              : undefined
          }
          open={editingFolder != null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingFolderId(null)
            }
          }}
        />

        {deletingFolder ? (
          <DeleteFolderDialog
            folderId={deletingFolder.id}
            open={deletingFolder != null}
            onOpenChange={(open) => {
              if (!open) {
                setDeletingFolderId(null)
              }
            }}
          />
        ) : null}

        {folders.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex h-full flex-col rounded-lg border border-border bg-background/95 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <FolderIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-medium">
                        {folder.name}
                      </span>
                      {folder.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-600">
                          <StarIcon className="w-3 h-3" />
                          {t('folders.default')}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t('folders.createdAt')}:{' '}
                      {new Date(folder.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <DropdownMenu
                    menus={getFolderMenus(folder)}
                    align="end"
                    side="bottom"
                  >
                    <Button variant="ghost" size="icon-xs">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        {folders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <div className="text-muted-foreground">
              {t('common.emptyState')}
            </div>
            <EditFolderDialog
              trigger={
                <Button disabled={isCreateDisabled}>
                  <PlusIcon />
                  {createFolderLabel}
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
