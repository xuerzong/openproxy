import { useState } from 'react'
import { toast } from 'sonner'
import {
  MoreHorizontalIcon,
  PenSquareIcon,
  RotateCcwKeyIcon,
  Trash2Icon,
} from 'lucide-react'
import { AIProviderFormSchema } from '@openproxy/schema'
import { AIProviderForm } from '@/components/AIProvider/AIProviderForm'
import { Card } from '@/components/Card'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { PageContainer } from '@/components/PageContainer'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { useForm } from '@/components/ui/Form'
import { Table } from '@/components/ui/Table'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { useRequest } from '@/contexts/ApiContext'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { AIProviderUpdateAPIKeyModal } from '@/components/AIProvider/AIProviderUpdateAPIKeyModal'
import { AIProviderDeleteModal } from '@/components/AIProvider/AIProviderDeleteModal'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/Select'
import { supportedAIProviders } from '@/constants/ai-providers'

const Page = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const aiProvidersQuery = useAIProvidersQuery()
  const [aiProviderForm] = useForm({
    defaultValues: {
      name: '',
      baseUrl: '',
      apiKey: '',
    },
    zodResolver: AIProviderFormSchema,
  })
  const [aiProviderOpen, setAIProviderOpen] = useState(false)
  const isEdit = Boolean(aiProviderForm.values.id)

  const [updateAPIKeyId, setUpdateAPIKeyId] = useState('')
  const [delAIProviderId, setDelAIProviderId] = useState('')

  const onAIProviderShow = () => {
    setAIProviderOpen(true)
  }

  const onAIProviderOk = () => {
    aiProviderForm.onSubmit((values) => {
      const response = isEdit
        ? request.aiProviders.put(values)
        : request.aiProviders.post(values)
      response.then((res) => {
        if (res.error) {
          toast.error(
            t('common.operationFailedWithStatus', {
              defaultValue: `Operation failed: ${res.error.status}`,
              status: res.error.status,
            })
          )
          return
        }
        toast.success(t('common.operationSuccess', { defaultValue: 'Success' }))
        aiProvidersQuery.refetch()
        onAIProviderCancel()
      })
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
      <Select options={supportedAIProviders.map((provider) => ({
        value: provider.name,
        label: provider.name,
        icon: (
          <img
            src={provider.icon}
            alt={provider.name}
            className="h-4 w-4 rounded-sm object-contain"
          />
        ),
      }))} />
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
            },
            {
              key: 'baseUrl',
              label: t('common.baseUrl', { defaultValue: 'Base URL' }),
            },
            {
              key: 'apiKey',
              label: t('common.apiKey', { defaultValue: 'API Key' }),
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
                            aiProviderForm.setValues(record)
                            onAIProviderShow()
                          },
                        },
                        {
                          type: 'item',
                          key: 'updateAPIKey',
                          label: t('apiKeys.updateApiKey', {
                            defaultValue: 'Update API Key',
                          }),
                          icon: <RotateCcwKeyIcon />,
                          onClick() {
                            setUpdateAPIKeyId(record.id)
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
          <DialogFooter onOk={onAIProviderOk} onCancel={onAIProviderCancel} />
        }
      >
        <AIProviderForm form={aiProviderForm} isEdit={isEdit} />
      </Dialog>

      <AIProviderUpdateAPIKeyModal
        id={updateAPIKeyId}
        open={Boolean(updateAPIKeyId)}
        onOpenChange={(open) => {
          if (!open) {
            setUpdateAPIKeyId('')
          }
        }}
        onSuccess={() => {
          aiProvidersQuery.refetch()
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
