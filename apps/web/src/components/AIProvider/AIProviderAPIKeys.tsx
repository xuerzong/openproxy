import { useState } from 'react'
import dayjs from 'dayjs'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Dialog } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { Table } from '@openproxy/ui/Table'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import type { AIProviderItem } from '@/hooks/queries/useAIProvidersQuery'

interface AIProviderAPIKeysProps {
  provider: AIProviderItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const AIProviderAPIKeys: React.FC<AIProviderAPIKeysProps> = ({
  provider,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [apiKey, setAPIKey] = useState('')

  const handleCreateAPIKey = () => {
    if (!provider || !apiKey.trim()) return

    void toastApiPromise(
      request.aiProviders.apiKeys.post({
        aiProviderId: provider.id,
        apiKey: apiKey.trim(),
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
          setAPIKey('')
          onSuccess?.()
        },
      }
    )
  }

  const handleDeleteAPIKey = (id: string) => {
    void toastApiPromise(request.aiProviders.apiKeys({ id }).delete(), {
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
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setAPIKey('')
        }
        onOpenChange(nextOpen)
      }}
      title={t('aiProviders.manageApiKeys', {
        defaultValue: 'AI Keys',
      })}
      width={800}
    >
      <div className="min-h-0 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={apiKey}
            placeholder={t('aiProviders.apiKeysPlaceholder', {
              defaultValue: 'Please input an API key',
            })}
            onChange={(e) => {
              setAPIKey(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateAPIKey()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCreateAPIKey}
            disabled={!apiKey.trim() || !provider}
          >
            <PlusIcon className="size-4" />
            {t('aiProviders.addApiKey', { defaultValue: 'Add API Key' })}
          </Button>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <Table
            rowKey={(record) => record.id}
            data={provider?.apiKeys || []}
            columns={[
              {
                key: 'apiKey',
                label: t('common.apiKey', { defaultValue: 'API Key' }),
                render: (_, record) => (
                  <span className="text-sm break-all">{record.apiKey}</span>
                ),
              },
              {
                key: 'createdAt',
                label: t('common.createdAt', { defaultValue: 'Created At' }),
                width: 180,
                render: (value) =>
                  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
              },
              {
                key: 'operation',
                label: t('common.operation', { defaultValue: 'Operation' }),
                width: 100,
                align: 'right',
                render: (_, record) => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      handleDeleteAPIKey(record.id)
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                ),
              },
            ]}
            locale={{
              noData: t('common.noData', { defaultValue: 'No data' }),
              emptyListHint: t('aiProviders.noApiKeys', {
                defaultValue: 'No API keys added yet',
              }),
            }}
          />
        </div>
      </div>
    </Dialog>
  )
}
