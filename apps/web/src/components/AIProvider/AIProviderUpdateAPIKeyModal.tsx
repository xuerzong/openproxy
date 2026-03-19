import { useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { Button } from '@openproxy/ui/Button'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'
import type { AIProviderItem } from '@/hooks/queries/useAIProvidersQuery'

interface AIProviderUpdateAPIKeyModalProps {
  provider: AIProviderItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const AIProviderUpdateAPIKeyModal: React.FC<
  AIProviderUpdateAPIKeyModalProps
> = ({ provider, open, onOpenChange, onSuccess }) => {
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
          onOpenChange(false)
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
        onOpenChange(false)
        onSuccess?.()
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setAPIKey('')
        }
        onOpenChange(open)
      }}
      title={t('aiProviders.manageApiKeys', {
        defaultValue: 'Manage API Keys',
      })}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('aiProviders.addApiKey', {
              defaultValue: 'Add API Key',
            }),
          }}
          onCancel={() => onOpenChange(false)}
          onOk={() => {
            handleCreateAPIKey()
          }}
          okButtonProps={{
            disabled: !apiKey.trim() || !provider,
          }}
        />
      }
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="text-sm font-medium">
            {t('aiProviders.currentApiKeys', {
              defaultValue: 'Current API Keys',
            })}
          </div>
          {provider?.apiKeys?.length ? (
            <div className="space-y-2">
              {provider.apiKeys.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm break-all">{item.apiKey}</span>
                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => {
                      handleDeleteAPIKey(item.id)
                    }}
                  >
                    {t('actions.delete', { defaultValue: 'Delete' })}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-foreground/70">
              {t('common.noData', { defaultValue: 'No data' })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">
            {t('aiProviders.addApiKey', { defaultValue: 'Add API Key' })}
          </div>
          <Input
            value={apiKey}
            placeholder={t('common.pleaseInput', {
              defaultValue: 'Please input',
            })}
            onChange={(e) => {
              setAPIKey(e.target.value)
            }}
          />
        </div>
      </div>
    </Dialog>
  )
}
