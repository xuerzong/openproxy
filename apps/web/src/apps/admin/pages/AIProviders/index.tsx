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
import { AIProviderUpdateAPIKeyModal } from '@/components/AIProvider/AIProviderUpdateAPIKeyModal'
import { AIProviderDeleteModal } from '@/components/AIProvider/AIProviderDeleteModal'
import { useTranslation } from 'react-i18next'
import { ModelIcon } from '@/components/ModelIcon'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import type { AIProviderItem } from '@/hooks/queries/useAIProvidersQuery'

const parseAPIKeysText = (value?: string | null) => {
  return Array.from(
    new Set(
      (value ?? '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const aiProvidersQuery = useAIProvidersQuery()
  const [aiProviderForm] = useForm({
    defaultValues: {
      name: '',
      baseUrl: '',
      apiKeysText: '',
      icon: '',
    },
    zodResolver: AIProviderFormSchema,
  })
  const [aiProviderOpen, setAIProviderOpen] = useState(false)
  const isEdit = Boolean(aiProviderForm.values.id)

  const [manageAPIKeysProvider, setManageAPIKeysProvider] =
    useState<AIProviderItem | null>(null)
  const [delAIProviderId, setDelAIProviderId] = useState('')

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
      const apiKeys = parseAPIKeysText(values.apiKeysText)

      if (!isEdit && apiKeys.length === 0) {
        aiProviderForm.setFieldError(
          'apiKeysText',
          t('aiProviders.apiKeysRequired', {
            defaultValue: 'Please enter at least one API key',
          })
        )
        return
      }

      void toastApiPromise(
        isEdit
          ? request.aiProviders.put({ id: values.id, ...payload })
          : request.aiProviders.post({ ...payload, apiKeys }),
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
                  <div className="space-y-1 py-1">
                    {record.apiKeys.map((item: any) => (
                      <div
                        key={item.id}
                        className="text-xs leading-5 break-all"
                      >
                        {item.apiKey}
                      </div>
                    ))}
                  </div>
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
                              apiKeysText: '',
                            })
                            onAIProviderShow()
                          },
                        },
                        {
                          type: 'item',
                          key: 'manageAPIKeys',
                          label: t('aiProviders.manageApiKeys', {
                            defaultValue: 'Manage API Keys',
                          }),
                          icon: <KeyRoundIcon />,
                          onClick() {
                            setManageAPIKeysProvider(record)
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
        <AIProviderForm form={aiProviderForm} isEdit={isEdit} />
      </Dialog>

      <AIProviderUpdateAPIKeyModal
        provider={manageAPIKeysProvider}
        open={Boolean(manageAPIKeysProvider)}
        onOpenChange={(open) => {
          if (!open) {
            setManageAPIKeysProvider(null)
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
