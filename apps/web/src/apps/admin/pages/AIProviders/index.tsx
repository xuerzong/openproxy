import { useState } from 'react'
import {
  MoreHorizontalIcon,
  KeyRoundIcon,
  InfoIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@openproxy/ui/Button'
import { Table } from '@openproxy/ui/Table'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import { AIProviderAPIKeys } from '@/components/AIProvider/AIProviderAPIKeys'
import { AIProviderDetailModal } from '@/components/AIProvider/AIProviderDetailModal'
import { AIProviderEditModal } from '@/components/AIProvider/AIProviderEditModal'
import { AIProviderSupportedStyleTag } from '@/components/AIProvider/AIProviderSupportedStyleTag'
import { useTranslation } from 'react-i18next'
import { ModelIcon } from '@/components/ModelIcon'
import { Tag } from '@openproxy/ui'
import { useRequest } from '@/contexts/ApiContext'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const aiProvidersQuery = useAIProvidersQuery()
  const [manageAPIKeysProviderId, setManageAPIKeysProviderId] = useState('')
  const [detailProviderId, setDetailProviderId] = useState('')
  const [editProviderId, setEditProviderId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteProviderId, setDeleteProviderId] = useState('')
  const [deleting, setDeleting] = useState(false)

  const manageAPIKeysProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === manageAPIKeysProviderId
    ) || null

  const detailProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === detailProviderId
    ) || null

  const editProvider =
    aiProvidersQuery.data?.find((provider) => provider.id === editProviderId) ||
    null

  const deleteProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === deleteProviderId
    ) || null

  const handleDelete = () => {
    if (!deleteProvider) return
    setDeleting(true)
    toastApiPromise(request.aiProviders({ id: deleteProvider.id }).delete(), {
      loading: t('common.processing'),
      success: t('common.operationSuccess'),
      error: (error) =>
        t('common.operationFailedWithStatus', {
          status: getToastRequestStatus(error),
        }),
      onSuccess: () => {
        setDeleteProviderId('')
        aiProvidersQuery.refetch()
      },
    }).finally(() => {
      setDeleting(false)
    })
  }

  return (
    <PageContainer title={t('aiProviders.title')} className="h-screen">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          {t('aiProviders.create')}
        </Button>
      </div>
      <FlexScrollViewer bordered>
        <Table
          rowKey={(d: any) => d.id}
          loading={aiProvidersQuery.isLoading}
          data={aiProvidersQuery.data || []}
          columns={[
            {
              key: 'name',
              label: t('common.name'),
              width: 240,
              fixed: 'left',
              render: (_, record) => {
                return (
                  <div className="flex items-center gap-1">
                    <ModelIcon model={record.id} />
                    <div className="min-w-0 flex items-center gap-2">
                      <span>{record.name}</span>
                      <Tag color={record.isBuiltIn ? 'gray' : 'blue'}>
                        {record.isBuiltIn
                          ? t('aiProviders.builtIn')
                          : t('aiProviders.custom')}
                      </Tag>
                    </div>
                  </div>
                )
              },
            },
            {
              key: 'supportedStyles',
              label: t('aiProviders.supportedStyles'),
              width: 200,
              ellipsis: true,
              render: (text) => (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(text) && text.length
                    ? text.map((s) => (
                        <AIProviderSupportedStyleTag key={s} style={s} />
                      ))
                    : '-'}
                </div>
              ),
            },
            {
              key: 'apiKey',
              width: 120,
              label: t('aiProviders.apiKeys'),
              render: (_, record) => {
                if (!record.apiKeys?.length) {
                  return '-'
                }

                return <Tag color="gray">{record.apiKeys.length}</Tag>
              },
            },
            {
              key: 'operation',
              label: t('common.operation'),
              width: 80,
              fixed: 'right',
              render: (_, record) => {
                return (
                  <div>
                    <DropdownMenu
                      menus={[
                        {
                          type: 'item',
                          key: 'detail',
                          label: t('aiProviders.detail'),
                          icon: <InfoIcon />,
                          onClick: () => {
                            setDetailProviderId(record.id)
                          },
                        },
                        {
                          type: 'item',
                          key: 'manageAPIKeys',
                          label: t('aiProviders.manageApiKeys'),
                          icon: <KeyRoundIcon />,
                          onClick: () => {
                            setManageAPIKeysProviderId(record.id)
                          },
                        },
                        {
                          type: 'item',
                          key: 'edit',
                          label: t('actions.edit'),
                          icon: <PencilIcon />,
                          disabled: record.isBuiltIn,
                          onClick: () => {
                            setEditProviderId(record.id)
                          },
                        },
                        {
                          type: 'item',
                          key: 'delete',
                          label: t('actions.delete'),
                          icon: <Trash2Icon />,
                          disabled: record.isBuiltIn,
                          onClick: () => {
                            setDeleteProviderId(record.id)
                          },
                        },
                      ]}
                    >
                      <Button variant="ghost" size="icon-xs">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenu>
                  </div>
                )
              },
            },
          ]}
          locale={{
            noData: t('common.noData'),
            emptyListHint: t('common.emptyListHint'),
          }}
        />
      </FlexScrollViewer>

      <AIProviderAPIKeys
        provider={manageAPIKeysProvider}
        open={Boolean(manageAPIKeysProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setManageAPIKeysProviderId('')
          }
        }}
        onSuccess={() => {
          aiProvidersQuery.refetch()
        }}
      />

      <AIProviderDetailModal
        provider={detailProvider}
        open={Boolean(detailProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProviderId('')
          }
        }}
      />

      <AIProviderEditModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          aiProvidersQuery.refetch()
        }}
      />

      <AIProviderEditModal
        provider={editProvider}
        open={Boolean(editProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditProviderId(null)
          }
        }}
        onSuccess={() => {
          aiProvidersQuery.refetch()
        }}
      />

      <Dialog
        open={Boolean(deleteProviderId)}
        onOpenChange={(open) => {
          if (!open) setDeleteProviderId('')
        }}
        title={t('aiProviders.deleteTitle')}
        footer={
          <DialogFooter
            okText={t('actions.delete')}
            cancelText={t('actions.cancel')}
            onCancel={() => setDeleteProviderId('')}
            onOk={handleDelete}
            okButtonProps={{ loading: deleting, variant: 'danger' }}
          />
        }
      >
        <div className="text-sm">
          {t('aiProviders.deleteConfirm')}
          {deleteProvider && (
            <div className="mt-2 font-medium">{deleteProvider.name}</div>
          )}
        </div>
      </Dialog>
    </PageContainer>
  )
}

export default Page
