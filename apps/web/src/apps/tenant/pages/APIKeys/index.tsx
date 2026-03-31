import { Fragment, useMemo, useState } from 'react'
import dayjs from '@openproxy/utils/dayjs'
import { useRequest } from '@/contexts/ApiContext'
import copy from 'copy-to-clipboard'
import { toast } from 'sonner'
import { APIKeyItem } from '@/components/APIKey/APIKeyItem'
import { useApiKeysQuery } from '@/apps/tenant/hooks/queries/useApiKeysQuery'
import { useApiKeyFoldersQuery } from '@/apps/tenant/hooks/queries/useApiKeyFoldersQuery'
import { Button } from '@openproxy/ui/Button'
import { PlusIcon } from 'lucide-react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Loader } from '@openproxy/ui/Loader'
import { Select } from '@openproxy/ui/Select'
import {
  APIKeyForm,
  NO_FOLDER_OPTION_VALUE,
} from '@/components/APIKey/APIKeyForm'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useForm } from '@openproxy/ui/Form'
import { PageContainer } from '@/components/PageContainer'
import { FlexScrollViewer } from '@/components/FlexScrollViewer'
import { NotFoundIllustration } from '@/components/NotFoundIllustration'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import { useSearchParams } from 'react-router'
import { useIsOSS } from '@/hooks/useIsOSS'

const ALL_FOLDERS_FILTER = '__all__'
const EMPTY_FOLDERS: Array<any> = []
const EMPTY_API_KEYS: Array<any> = []

const normalizeFolderIdForSubmit = (folderId?: string | null) => {
  if (!folderId || folderId === NO_FOLDER_OPTION_VALUE) {
    return null
  }

  return folderId
}

const Page = () => {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const request = useRequest()
  const [newApiKey, setNewApiKey] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const teamQuery = useTeamQuery()
  const isOSS = useIsOSS()
  const apiKeysQuery = useApiKeysQuery()
  const foldersQuery = useApiKeyFoldersQuery()
  const loading =
    teamQuery.isLoading || apiKeysQuery.isLoading || foldersQuery.isLoading
  const folders = foldersQuery.data ?? EMPTY_FOLDERS
  const apiKeyLimit = teamQuery.data?.team?.apiKeyLimit
  const apiKeyCount = apiKeysQuery.data?.length || 0
  const isCreateDisabled = !isOSS && !!apiKeyLimit && apiKeyCount >= apiKeyLimit
  const totalApiKeysLabel =
    isOSS || !apiKeyLimit ? t('common.unlimited') : String(apiKeyLimit)
  const folderQuery = searchParams.get('folder')
  const selectedFolderId =
    folderQuery && folders.some((folder: any) => folder.id === folderQuery)
      ? folderQuery
      : ALL_FOLDERS_FILTER
  const defaultCreateFolderId =
    selectedFolderId !== ALL_FOLDERS_FILTER &&
    folders.some((folder: any) => folder.id === selectedFolderId)
      ? selectedFolderId
      : folders.find((folder: any) => folder.isDefault)?.id ||
        folders[0]?.id ||
        ''

  const setSelectedFolderId = (folderId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (folderId === ALL_FOLDERS_FILTER) {
      nextSearchParams.delete('folder')
    } else {
      nextSearchParams.set('folder', folderId)
    }
    setSearchParams(nextSearchParams)
  }

  const filteredApiKeys = useMemo(() => {
    const keys = apiKeysQuery.data ?? EMPTY_API_KEYS
    if (selectedFolderId === ALL_FOLDERS_FILTER) return keys
    return keys.filter((k: any) => k.folderId === selectedFolderId)
  }, [apiKeysQuery.data, selectedFolderId])
  const folderOptions = useMemo(
    () => [
      {
        value: ALL_FOLDERS_FILTER,
        label: t('apiKeys.allFolders'),
      },
      ...folders.map((folder: any) => ({
        value: folder.id,
        label: folder.isDefault ? (
          <span>
            {folder.name}
            <span className="ml-1 text-xs opacity-60">
              ({t('folders.default')})
            </span>
          </span>
        ) : (
          folder.name
        ),
      })),
    ],
    [folders, t]
  )

  const [apiKeyForm] = useForm({
    defaultValues: {
      name: '',
      folderId: '',
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
      folderId: async (value, values: any) => {
        if (values.id || normalizeFolderIdForSubmit(value)) {
          return { success: true }
        }

        return {
          success: false,
          message: t('common.selectPlaceholder', {
            defaultValue: 'Please select',
          }),
        }
      },
    },
  })

  const isEdit = Boolean(apiKeyForm.values.id)

  return (
    <PageContainer
      title={t('apiKeys.title', { defaultValue: 'API Keys' })}
      className="h-screen"
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          {folders.length > 0 && (
            <Select
              value={selectedFolderId}
              onChange={setSelectedFolderId}
              options={folderOptions}
              placeholder={t('apiKeys.allFolders')}
            />
          )}
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            apiKeyForm.setValues({
              name: '',
              folderId: defaultCreateFolderId,
            })
            apiKeyForm.resetErrors()
            setOpen(true)
          }}
          disabled={loading || isCreateDisabled}
        >
          <PlusIcon />
          {t('apiKeys.createWithCount', {
            count: apiKeyCount,
            total: totalApiKeysLabel,
          })}
        </Button>
      </div>

      <FlexScrollViewer bordered>
        {loading && (
          <div className="flex min-h-80 items-center justify-center text-primary">
            <Loader />
          </div>
        )}
        {!loading &&
          filteredApiKeys.map((apiKey: any, apiKeyIndex: number) => (
            <Fragment key={apiKey.id}>
              <APIKeyItem
                apiKey={apiKey}
                onEdit={() => {
                  apiKeyForm.setValues({
                    ...apiKey,
                    modelIds: apiKey.modelIds,
                    folderId: apiKey.folderId || NO_FOLDER_OPTION_VALUE,
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
              {apiKeyIndex !== filteredApiKeys.length - 1 && (
                <div className="h-px bg-border w-full" />
              )}
            </Fragment>
          ))}
        {!loading && filteredApiKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <NotFoundIllustration className="w-64" />
            <div className="">
              {t('common.emptyState', { defaultValue: 'Nothing here yet' })}
            </div>
            <Button
              disabled={isCreateDisabled}
              onClick={() => {
                apiKeyForm.setValues({
                  name: '',
                  folderId: defaultCreateFolderId,
                })
                apiKeyForm.resetErrors()
                setOpen(true)
              }}
            >
              <PlusIcon />
              {t('apiKeys.createWithCount', {
                count: apiKeyCount,
                total: totalApiKeysLabel,
              })}
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
                  const createFolderId = normalizeFolderIdForSubmit(
                    values.folderId
                  )

                  if (!values.id && !createFolderId) {
                    apiKeyForm.setFieldError(
                      'folderId',
                      t('common.selectPlaceholder', {
                        defaultValue: 'Please select',
                      })
                    )
                    return
                  }

                  const resp = values.id
                    ? request.apiKeys.put({
                        id: values.id,
                        name: values.name,
                        folderId: normalizeFolderIdForSubmit(values.folderId),
                        modelIds: Array.from(new Set(modelIds)),
                        maxQuota: values.maxQuota ?? '0.00',
                        maxRequests: values.maxRequests ?? 0,
                        expiresAt: values.expiresAt
                          ? dayjs(values.expiresAt).toDate()
                          : null,
                      })
                    : request.apiKeys.post({
                        name: values.name,
                        folderId: createFolderId!,
                        modelIds: Array.from(new Set(modelIds)),
                        maxQuota: values.maxQuota ?? void 0,
                        maxRequests: values.maxRequests ?? void 0,
                        expiresAt: values.expiresAt
                          ? dayjs(values.expiresAt).toDate()
                          : null,
                      })

                  toastApiPromise(resp, {
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
                      apiKeysQuery.refetch()
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
        <APIKeyForm form={apiKeyForm} allowNoFolder={isEdit} />
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
              toastApiPromise(request.apiKeys({ id: deleteId }).delete(), {
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
                  apiKeysQuery.refetch()
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
