import { Fragment, useState } from 'react'
import dayjs from '@/utils/dayjs'
import { useRequest } from '@/contexts/ApiContext'
import copy from 'copy-to-clipboard'
import { toast } from 'sonner'
import { APIKeyItem } from '@/components/APIKey/APIKeyItem'
import { useApiKeysQuery } from '@/apps/tenant/hooks/queries/useApiKeysQuery'
import { Button } from '@openproxy/ui/Button'
import { PlusIcon } from 'lucide-react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { APIKeyForm } from '@/components/APIKey/APIKeyForm'
import { useForm } from '@openproxy/ui/Form'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

const Page = () => {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const request = useRequest()
  const [newApiKey, setNewApiKey] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const apiKeysQuery = useApiKeysQuery()
  const [apiKeyForm] = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      name: async (value) => {
        if (value.trim().length === 0) {
          return {
            success: false,
            message: t('common.pleaseInput', { defaultValue: 'Please input' }),
          }
        }
        return { success: true }
      },
    },
  })

  const isEdit = Boolean(apiKeyForm.values.id)

  return (
    <PageContainer
      title={t('apiKeys.title', { defaultValue: 'API Keys' })}
      className="h-screen"
    >
      <div className="flex items-center w-full gap-2">
        <div style={{ flex: 1 }}></div>

        <Button
          onClick={() => {
            apiKeyForm.resetValues()
            apiKeyForm.resetErrors()
            setOpen(true)
          }}
          disabled={apiKeysQuery.data?.length === 10}
        >
          <PlusIcon />
          {t('apiKeys.createWithCount', {
            defaultValue: 'Create API Key ({{count}}/10)',
            count: apiKeysQuery.data?.length || 0,
          })}
        </Button>
      </div>
      <FlexScrollViewer bordered>
        {apiKeysQuery.data &&
          apiKeysQuery.data.map((apiKey, apiKeyIndex) => (
            <Fragment key={apiKey.id}>
              <APIKeyItem
                apiKey={apiKey}
                onEdit={() => {
                  apiKeyForm.setValues({
                    ...apiKey,
                    modelIds: apiKey.modelIds,
                    expiresAt: apiKey.expiresAt
                      ? dayjs(apiKey.expiresAt).format('YYYY-MM-DDTHH:mm')
                      : void 0,
                    maxQuota:
                      Number(apiKey.maxQuota) === 0 ? void 0 : apiKey.maxQuota,
                    maxRequests:
                      Number(apiKey.maxRequests) === 0
                        ? void 0
                        : apiKey.maxRequests,
                  })
                  setOpen(true)
                }}
                onDelete={() => {
                  setDeleteId(apiKey.id)
                }}
              />
              {apiKeyIndex !== apiKeysQuery.data!.length - 1 && (
                <div className="h-px bg-border w-full" />
              )}
            </Fragment>
          ))}
        {apiKeysQuery.data && apiKeysQuery.data.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <img className="w-64" src="/404.svg" />
            <div className="">
              {t('common.emptyState', { defaultValue: 'Nothing here yet' })}
            </div>
            <Button
              onClick={() => {
                setOpen(true)
              }}
            >
              <PlusIcon />
              {t('actions.createNow', { defaultValue: 'Create now' })}
            </Button>
          </div>
        )}
      </FlexScrollViewer>
      <Dialog
        open={open}
        title={
          isEdit
            ? t('apiKeys.editTitle', { defaultValue: 'Edit API Key' })
            : t('apiKeys.createTitle', { defaultValue: 'Create API Key' })
        }
        onOpenChange={(open) => {
          setOpen(open)
          if (!open) {
            apiKeyForm.resetValues()
            apiKeyForm.resetErrors()
          }
        }}
        width={800}
        footer={
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                apiKeyForm.resetValues()
                apiKeyForm.resetErrors()
              }}
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              onClick={() => {
                apiKeyForm.onSubmit((values) => {
                  const { modelIds = [] } = values

                  const resp = values.id
                    ? request.apiKeys.put({
                        id: values.id,
                        name: values.name,
                        modelIds: Array.from(new Set(modelIds)),
                        maxQuota: values.maxQuota ?? '0.00',
                        maxRequests: values.maxRequests ?? 0,
                        expiresAt: values.expiresAt
                          ? dayjs(values.expiresAt).toDate()
                          : null,
                      })
                    : request.apiKeys.post({
                        name: values.name,
                        modelIds: Array.from(new Set(modelIds)),
                        maxQuota: values.maxQuota ?? void 0,
                        maxRequests: values.maxRequests ?? void 0,
                        expiresAt: values.expiresAt
                          ? dayjs(values.expiresAt).toDate()
                          : null,
                      })

                  void toastApiPromise(resp, {
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
                    onSuccess: (data) => {
                      if (data && !values.id) {
                        setNewApiKey(data as string)
                      }
                      void apiKeysQuery.refetch()
                      setOpen(false)
                    },
                  })
                })
              }}
            >
              {isEdit
                ? t('actions.confirmChanges', {
                    defaultValue: 'Confirm changes',
                  })
                : t('actions.confirmCreate', { defaultValue: 'Create' })}
            </Button>
          </div>
        }
      >
        <APIKeyForm form={apiKeyForm} />
      </Dialog>

      <Dialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId('')
          }
        }}
        title={t('actions.confirmDelete', { defaultValue: 'Confirm delete' })}
        footer={
          <DialogFooter
            okText={t('actions.confirmDelete', {
              defaultValue: 'Confirm delete',
            })}
            okButtonProps={{
              variant: 'danger',
            }}
            onOk={() => {
              void toastApiPromise(request.apiKeys({ id: deleteId }).delete(), {
                loading: t('common.processing', {
                  defaultValue: 'Processing...',
                }),
                success: t('apiKeys.deleteSuccess', {
                  defaultValue: 'API key deleted successfully',
                }),
                error: (error) =>
                  t('common.operationFailedWithStatus', {
                    defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
                    status: getToastRequestStatus(error),
                  }),
                onSuccess: () => {
                  setDeleteId('')
                  void apiKeysQuery.refetch()
                  setOpen(false)
                },
              })
            }}
            cancelText={t('actions.cancel', { defaultValue: 'Cancel' })}
            onCancel={() => {
              setDeleteId('')
            }}
          />
        }
      >
        <div>
          {t('apiKeys.deleteWarning', {
            defaultValue:
              'This API key will be disabled immediately. Requests made with this key will be rejected and may break systems depending on it. Once deleted, you can no longer view or modify this API key.',
          })}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(newApiKey)}
        onOpenChange={(open) => {
          if (!open) {
            setNewApiKey('')
          }
        }}
        title={t('apiKeys.newTitle', { defaultValue: 'New API Key' })}
        footer={
          <DialogFooter
            okText={t('actions.copy', { defaultValue: 'Copy' })}
            onOk={() => {
              copy(newApiKey)
              toast.success(t('common.copySuccess', { defaultValue: 'Copied' }))
            }}
            cancelText={t('actions.close', { defaultValue: 'Close' })}
            onCancel={() => {
              setNewApiKey('')
            }}
          />
        }
      >
        <div className="flex flex-col gap-2">
          <p>
            {t('apiKeys.newHint', {
              defaultValue:
                'Store this API key in a safe and accessible place. For security reasons, you will not be able to view it again in API key management. If you lose it, you need to create a new one.',
            })}
          </p>
          <Input readOnly value={newApiKey} />
        </div>
      </Dialog>
    </PageContainer>
  )
}

export default Page
