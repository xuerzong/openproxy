import { useMemo, useState } from 'react'
import { MoreVerticalIcon, PenSquareIcon, Trash2Icon } from 'lucide-react'
import { type CheckboxGroupProps } from '@/components/ui/Checkbox'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { Button } from '../ui/Button'
import { Form, FormField, useForm } from '../ui/Form'
import { Input } from '../ui/Input'
import { Dialog, DialogFooter } from '../ui/Dialog'
import { NumberInput } from '../ui/NumberInput'
import { Card } from '../Card'
import { Table } from '../ui/Table'
import { ModelIcon } from '../ModelIcon'
import { DropdownMenu } from '../ui/DropdownMenu'
import { useRequest } from '@/contexts/ApiContext'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface AIProviderSelectorProps extends Omit<CheckboxGroupProps, 'options'> {
  id: string
  providers: any[]
  onSuccess?: () => void
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  id,
  onSuccess,
  providers,
  ...restProps
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const aiProvidersQuery = useAIProvidersQuery()

  const [providerModelForm] = useForm({})
  const [providerId, setProviderId] = useState('')
  const [deleteProviderId, setDeleteProviderId] = useState('')

  const providersDataSource = useMemo(() => {
    return (
      aiProvidersQuery.data?.map((provider) => {
        const currentProvider = providers.find(
          (d: any) => d.provider.id === provider.id
        )
        return {
          id: provider.id,
          name: provider.name,
          model: currentProvider?.model,
          weight: currentProvider?.weight,
        }
      }) || []
    )
  }, [aiProvidersQuery.data])

  return (
    <>
      <Card className="p-0 overflow-hidden my-4">
        <Table
          rowKey={(d) => d.id}
          data={providersDataSource}
          columns={[
            {
              key: 'name',
              label: t('aiProviders.provider', { defaultValue: 'Provider' }),
            },
            {
              key: 'model',
              label: t('models.modelName', { defaultValue: 'Model Name' }),
              render: (text) =>
                text ? (
                  <div className="flex items-center gap-2">
                    <ModelIcon className="w-4 h-4" model={text} />
                    {text}
                  </div>
                ) : (
                  '-'
                ),
            },
            {
              key: 'weight',
              label: t('common.weight', { defaultValue: 'Weight' }),
              render: (text) => text ?? '-',
            },
            {
              key: 'operation',
              label: '',
              width: 60,
              align: 'center',
              render: (_, record) => {
                return (
                  <div className="flex items-center gap-2">
                    <DropdownMenu
                      side="left"
                      align="start"
                      menus={[
                        {
                          type: 'item',
                          key: 'edit',
                          label: t('actions.edit', { defaultValue: 'Edit' }),
                          icon: <PenSquareIcon />,
                          onClick() {
                            providerModelForm.setValues(record)
                            setProviderId(record.id)
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
                            setDeleteProviderId(record.id)
                          },
                        },
                      ]}
                    >
                      <Button size="icon-xs" variant="ghost">
                        <MoreVerticalIcon />
                      </Button>
                    </DropdownMenu>
                  </div>
                )
              },
            },
          ]}
        />
      </Card>
      <Dialog
        title={t('models.configure', { defaultValue: 'Configure Model' })}
        open={Boolean(providerId)}
        onOpenChange={(open) => {
          if (!open) {
            setProviderId('')
          }
        }}
        footer={
          <DialogFooter
            onOk={() => {
              providerModelForm.onSubmit((values) => {
                request.models.upsertProvider
                  .post({
                    modelId: id,
                    provider: {
                      id: providerId,
                      model: values.model,
                      weight: values.weight || 0,
                    },
                  })
                  .then((res) => {
                    if (res.error) {
                      toast.error(
                        t('common.operationFailedWithStatus', {
                          defaultValue: `Operation failed: ${res.error.status}`,
                          status: res.error.status,
                        })
                      )
                      return
                    }
                    toast.success(
                      t('common.operationSuccess', { defaultValue: 'Success' })
                    )
                    onSuccess?.()
                    setProviderId('')
                  })
              })
            }}
          />
        }
      >
        <Form form={providerModelForm}>
          <FormField
            name="model"
            label={t('models.modelName', { defaultValue: 'Model Name' })}
          >
            <Input
              placeholder={t('common.pleaseInput', {
                defaultValue: 'Please input',
              })}
            />
          </FormField>

          <FormField
            name="weight"
            label={t('common.weight', { defaultValue: 'Weight' })}
          >
            <NumberInput
              inputProps={{
                placeholder: t('common.pleaseInput', {
                  defaultValue: 'Please input',
                }),
              }}
            />
          </FormField>
        </Form>
      </Dialog>

      <Dialog
        title={t('actions.confirmDelete', { defaultValue: 'Confirm delete' })}
        open={Boolean(deleteProviderId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProviderId('')
          }
        }}
        footer={
          <DialogFooter
            okText={t('actions.confirmDelete', {
              defaultValue: 'Confirm delete',
            })}
            okButtonProps={{
              variant: 'danger',
            }}
            onOk={() => {
              request.models.delProvider
                .post({
                  modelId: id,
                  provider: { id: deleteProviderId },
                })
                .then((res) => {
                  if (res.error) {
                    toast.error(
                      t('common.operationFailedWithStatus', {
                        defaultValue: `Operation failed: ${res.error.status}`,
                        status: res.error.status,
                      })
                    )
                    return
                  }
                  toast.success(
                    t('common.operationSuccess', { defaultValue: 'Success' })
                  )
                  onSuccess?.()
                  setDeleteProviderId('')
                })
            }}
            onCancel={() => {
              setDeleteProviderId('')
            }}
          />
        }
      />
    </>
  )
}
