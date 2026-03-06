import { useMemo, useState } from 'react'
import { MoreVerticalIcon, PenSquareIcon, Trash2Icon } from 'lucide-react'
import { type CheckboxGroupProps } from '@/components/ui/Checkbox'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { Button } from '../ui/Button'
import { Form, FormField, useForm } from '../ui/Form'
import { Input } from '../ui/Input'
import { Dialog, DialogFooter } from '../ui/Dialog'
import { NumberInput } from '../ui/NumberInput'
import { Switch } from '../ui/Switch'
import { Card } from '../Card'
import { Table } from '../ui/Table'
import { ModelIcon } from '../ModelIcon'
import { DropdownMenu } from '../ui/DropdownMenu'
import { useRequest } from '@/contexts/ApiContext'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Select } from '../ui/Select'

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
  const [providerOpen, setProviderOpen] = useState(false)
  const [editingProviderId, setEditingProviderId] = useState('')
  const [deleteProviderId, setDeleteProviderId] = useState('')
  const [switchingProviderId, setSwitchingProviderId] = useState('')

  const providersDataSource = useMemo(() => {
    return (
      aiProvidersQuery.data?.map((provider) => {
        const currentProvider = providers.find(
          (d: any) => d.provider.id === provider.id
        )
        return {
          id: currentProvider?.id || provider.id,
          aiProviderId: provider.id,
          name: provider.name,
          model: currentProvider?.model,
          weight: currentProvider?.weight,
          status: currentProvider?.status ?? 1,
        }
      }) || []
    )
  }, [aiProvidersQuery.data, providers])

  const handleProviderClose = () => {
    providerModelForm.resetValues()
    providerModelForm.resetErrors()
    setEditingProviderId('')
    setProviderOpen(false)
  }

  return (
    <>
      <div>
        <Button
          onClick={() => {
            setEditingProviderId('')
            setProviderOpen(true)
          }}
        >
          添加供应商
        </Button>
      </div>
      <Card className="p-0 overflow-hidden my-4">
        <Table
          rowKey={(d) => d.id}
          data={providersDataSource}
          columns={[
            {
              key: 'name',
              label: t('common.provider', { defaultValue: 'Provider' }),
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
              key: 'status',
              label: t('common.status', { defaultValue: 'Status' }),
              render: (_, record) => {
                if (!record.model) return '-'

                return (
                  <Switch
                    checked={record.status === 1}
                    disabled={switchingProviderId === record.id}
                    onCheckedChange={(checked) => {
                      setSwitchingProviderId(record.id)
                      request.models.updateProvider
                        .post({
                          aiProviderId: record.aiProviderId,
                          provider: {
                            id: record.id,
                            model: record.model,
                            weight: record.weight || 0,
                            status: checked ? 1 : 0,
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
                            t('common.operationSuccess', {
                              defaultValue: 'Success',
                            })
                          )
                          onSuccess?.()
                        })
                        .finally(() => {
                          setSwitchingProviderId('')
                        })
                    }}
                  />
                )
              },
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
                            providerModelForm.setValues({
                              providerId: record.aiProviderId,
                              model: record.model,
                              weight: record.weight,
                              status: record.status,
                            })
                            setEditingProviderId(record.id)
                            setProviderOpen(true)
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
        title={
          editingProviderId
            ? t('models.editProvider', { defaultValue: 'Edit Provider' })
            : t('models.addProvider', { defaultValue: 'Add Provider' })
        }
        open={providerOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleProviderClose()
          }
          setProviderOpen(open)
        }}
        footer={
          <DialogFooter
            onOk={() => {
              providerModelForm.onSubmit((values) => {
                const api = editingProviderId
                  ? request.models.updateProvider.post({
                      aiProviderId: values.providerId,
                      provider: {
                        id: editingProviderId,
                        model: values.model,
                        weight: values.weight || 0,
                        status: values.status ?? 1,
                      },
                    })
                  : request.models.insertProvider.post({
                      modelId: id,
                      aiProviderId: values.providerId,
                      provider: {
                        model: values.model,
                        weight: values.weight || 0,
                        status: values.status ?? 1,
                      },
                    })

                api.then((res) => {
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
                  handleProviderClose()
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
            name="providerId"
            label={t('common.provider', { defaultValue: 'Provider' })}
          >
            <Select
              placeholder={t('common.selectPlaceholder', {
                defaultValue: 'Please select',
              })}
              options={aiProvidersQuery.data?.map((provider) => ({
                value: provider.id,
                label: provider.name,
              }))}
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
