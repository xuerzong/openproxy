import { useState } from 'react'
import {
  MoreHorizontalIcon,
  KeyRoundIcon,
  PenSquareIcon,
  Trash2Icon,
} from 'lucide-react'
import { AIProviderFormSchema } from '@openproxy/schema'
import { AIProviderForm } from '@/components/AIProvider/AIProviderForm'
import { Card } from '@/components/Card'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@openproxy/ui/Button'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { useForm } from '@openproxy/ui/Form'
import { Table } from '@openproxy/ui/Table'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { useRequest } from '@/contexts/ApiContext'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import { AIProviderAPIKeys } from '@/components/AIProvider/AIProviderAPIKeys'
import { AIProviderDeleteModal } from '@/components/AIProvider/AIProviderDeleteModal'
import { useTranslation } from 'react-i18next'
import { ModelIcon } from '@/components/ModelIcon'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const aiProvidersQuery = useAIProvidersQuery()
  const [aiProviderForm] = useForm({
    defaultValues: {
      name: '',
      baseUrl: '',
      icon: '',
    },
    zodResolver: AIProviderFormSchema,
  })
  const [aiProviderOpen, setAIProviderOpen] = useState(false)
  const isEdit = Boolean(aiProviderForm.values.id)

  const [manageAPIKeysProviderId, setManageAPIKeysProviderId] = useState('')
  const [delAIProviderId, setDelAIProviderId] = useState('')

  const manageAPIKeysProvider =
    aiProvidersQuery.data?.find(
      (provider) => provider.id === manageAPIKeysProviderId
    ) || null

  const onAIProviderShow = () => {
    setAIProviderOpen(true)
  }

  const onAIProviderOk = () => {
    aiProviderForm.onSubmit((values) => {
      const payload = {
        name: values.name,
        baseUrl: values.baseUrl,
        icon: values.icon,
      }

      void toastApiPromise(
        isEdit
          ? request.aiProviders.put({ id: values.id, ...payload })
          : request.aiProviders.post({ ...payload, apiKeys: [] }),
        {
          loading: t('common.processing', {
            defaultValue: 'Processing...',
          }),
          success: t('common.operationSuccess', { defaultValue: 'Success' }),
          error: (error) =>
            t('common.operationFailedWithStatus', {
              defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
              status: getToastRequestStatus(error),
            }),
          onSuccess: () => {
            void aiProvidersQuery.refetch()
            onAIProviderCancel()
          },
        }
      )
    })
  }

  const onAIProviderCancel = () => {
    aiProviderForm.resetErrors()
    aiProviderForm.resetValues()
    setAIProviderOpen(false)
  }

  return (
    <PageContainer
      title={t('aiProviders.title', { defaultValue: 'AI Providers' })}
      className="h-screen"
    >
      <Card className="flex justify-end">
        <Button onClick={onAIProviderShow}>
          {t('aiProviders.add', { defaultValue: 'Add Provider' })}
        </Button>
      </Card>
      <FlexScrollViewer bordered>
        <Table
          rowKey={(d: any) => d.id}
          loading={aiProvidersQuery.isLoading}
          data={aiProvidersQuery.data || []}
          columns={[
            {
              key: 'name',
              label: t('common.name', { defaultValue: 'Name' }),
              render: (_, record) => {
                return (
                  <div className="flex items-center gap-1">
                    <ModelIcon model={record.icon} />
                    <span>{record.name}</span>
                  </div>
                )
              },
            },
            {
              key: 'baseUrl',
              label: t('common.baseUrl', { defaultValue: 'Base URL' }),
            },
            {
              key: 'apiKey',
              label: t('aiProviders.apiKeys', { defaultValue: 'API Keys' }),
              render: (_, record) => {
                if (!record.apiKeys?.length) {
                  return '-'
                }

                return (
                  <span>
                    {t('aiProviders.apiKeyCount', {
                      defaultValue: '{{count}} keys',
                      count: record.apiKeys.length,
                    })}
                  </span>
                )
              },
            },
            {
              key: 'operation',
              label: t('common.operation', { defaultValue: 'Operation' }),
              render(value, record) {
                return (
                  <div>
                    <DropdownMenu
                      menus={[
                        {
                          type: 'item',
                          key: 'edit',
                          label: t('actions.edit', { defaultValue: 'Edit' }),
                          icon: <PenSquareIcon />,
                          onClick() {
                            aiProviderForm.setValues({
                              ...record,
                            })
                            onAIProviderShow()
                          },
                        },
                        {
                          type: 'item',
                          key: 'manageAPIKeys',
                          label: t('aiProviders.manageApiKeys', {
                            defaultValue: 'AI Keys',
                          }),
                          icon: <KeyRoundIcon />,
                          onClick() {
                            setManageAPIKeysProviderId(record.id)
                          },
                        },
                        {
                          type: 'item',
                          key: 'delete',
                          label: t('actions.delete', {
                            defaultValue: 'Delete',
                          }),
                          icon: <Trash2Icon />,
                          onClick() {
                            setDelAIProviderId(record.id)
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
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
        />
      </FlexScrollViewer>

      <Dialog
        title={
          isEdit
            ? t('aiProviders.editTitle', { defaultValue: 'Edit AI Provider' })
            : t('aiProviders.addTitle', { defaultValue: 'Add AI Provider' })
        }
        open={aiProviderOpen}
        onOpenChange={(open) => {
          if (!open) {
            onAIProviderCancel()
          }
        }}
        footer={
          <DialogFooter
            onOk={onAIProviderOk}
            onCancel={onAIProviderCancel}
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
          />
        }
      >
        <div className="overflow-y-scroll h-full">
          <AIProviderForm form={aiProviderForm} />
        </div>
      </Dialog>

      <AIProviderAPIKeys
        provider={manageAPIKeysProvider}
        open={Boolean(manageAPIKeysProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setManageAPIKeysProviderId('')
          }
        }}
        onSuccess={() => {
          void aiProvidersQuery.refetch()
        }}
      />

      <AIProviderDeleteModal
        id={delAIProviderId}
        open={Boolean(delAIProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setDelAIProviderId('')
          }
        }}
        onSuccess={() => {
          aiProvidersQuery.refetch()
        }}
      />
    </PageContainer>
  )
}

export default Page
