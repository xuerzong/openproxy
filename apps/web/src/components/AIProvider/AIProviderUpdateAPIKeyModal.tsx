import { useState } from 'react'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { Input } from '@openproxy/ui/Input'
import { useRequest } from '@/contexts/ApiContext'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
            request.aiProviders.updateAPIKey.put({ id, apiKey }).then((res) => {
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
              onOpenChange(false)
              onSuccess?.()
            })
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
