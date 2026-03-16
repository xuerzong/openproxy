import { useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { useRequest } from '@/contexts/ApiContext'
import { useTranslation } from 'react-i18next'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface AIProviderUpdateAPIKeyModalProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export const AIProviderUpdateAPIKeyModal: React.FC<
  AIProviderUpdateAPIKeyModalProps
> = ({ id, open, onOpenChange, onSuccess }) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [apiKey, setAPIKey] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setAPIKey('')
        }
        onOpenChange(open)
      }}
      title={t('apiKeys.updateApiKey', { defaultValue: 'Update API Key' })}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
          }}
          onOk={() => {
            void toastApiPromise(
              request.aiProviders.updateAPIKey.put({ id, apiKey }),
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
                  onOpenChange(false)
                  onSuccess?.()
                },
              }
            )
          }}
        />
      }
    >
      <Input
        value={apiKey}
        placeholder={t('common.pleaseInput', { defaultValue: 'Please input' })}
        onChange={(e) => {
          setAPIKey(e.target.value)
        }}
      />
    </Dialog>
  )
}
