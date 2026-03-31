import { useMemo, useState } from 'react'
import { MoreVerticalIcon, PenSquareIcon, Trash2Icon } from 'lucide-react'
import { type CheckboxGroupProps } from '@openproxy/ui/Checkbox'
import { useAIProvidersQuery } from '@/hooks/queries/useAIProvidersQuery'
import { Button } from '@openproxy/ui/Button'
import { Form, FormField, useForm } from '@openproxy/ui/Form'
import { Input } from '@openproxy/ui/Input'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { NumberInput } from '@openproxy/ui/NumberInput'
import { Switch } from '@openproxy/ui/Switch'
import { Card } from '../Card'
import { Table } from '@openproxy/ui/Table'
import { ModelIcon } from '../ModelIcon'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'
import { Select } from '@openproxy/ui/Select'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface AIProviderSelectorProps extends Omit<CheckboxGroupProps, 'options'> {
  id: string
  providers: any[]
  onSuccess?: () => void
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  id,
  onSuccess,
  providers,
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
    return providers.map((item: any) => ({
      id: item.id,
      aiProviderId: item.provider?.id,
      name: item.provider?.name,
      model: item.model,
      weight: item.weight,
      status: item.status ?? 1,
      icon: item.provider?.icon,
    }))
  }, [providers])

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
              key: 'model',
              label: t('models.modelName', { defaultValue: 'Model Name' }),
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
                      toastApiPromise(
                        request.models.updateProvider.post({
                          aiProviderId: record.aiProviderId,
                          provider: {
                            id: record.id,
                            model: record.model,
                            weight: record.weight || 0,
                            status: checked ? 1 : 0,
                          },
                        }),
                        {
                          loading: t('common.processing', {
                            defaultValue: 'Processing...',
                          }),
                          success: t('common.operationSuccess', {
                            defaultValue: 'Success',
                          }),
                          error: (error) =>
                            t('common.operationFailedWithStatus', {
                              defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                              status: getToastRequestStatus(error),
                            }),
                          onSuccess: () => {
                            onSuccess?.()
                          },
                        }
                      ).finally(() => {
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
          locale={{
            noData: t('common.noData', { defaultValue: 'No data' }),
            emptyListHint: t('common.emptyListHint', {
              defaultValue: 'No records yet',
            }),
          }}
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
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
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

                toastApiPromise(api, {
                  loading: t('common.processing', {
                    defaultValue: 'Processing...',
                  }),
                  success: t('common.operationSuccess', {
                    defaultValue: 'Success',
                  }),
                  error: (error) =>
                    t('common.operationFailedWithStatus', {
                      defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                      status: getToastRequestStatus(error),
                    }),
                  onSuccess: () => {
                    onSuccess?.()
                    handleProviderClose()
                  },
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
            locale={{
              cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
              confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
            }}
            okButtonProps={{
              variant: 'danger',
            }}
            onOk={() => {
              toastApiPromise(
                request.models.delProvider.post({
                  provider: { id: deleteProviderId },
                }),
                {
                  loading: t('common.processing', {
                    defaultValue: 'Processing...',
                  }),
                  success: t('common.operationSuccess', {
                    defaultValue: 'Success',
                  }),
                  error: (error) =>
                    t('common.operationFailedWithStatus', {
                      defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                      status: getToastRequestStatus(error),
                    }),
                  onSuccess: () => {
                    onSuccess?.()
                    setDeleteProviderId('')
                  },
                }
              )
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
