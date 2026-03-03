import { BillingForm } from './BillingForm'
import { Dialog } from './ui/Dialog'
import { useTranslation } from 'react-i18next'

interface BillingModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  afterOpenChange?: (open: boolean) => void
  onFinish?: () => void
}

export const BillingModal: React.FC<BillingModalProps> = ({
  open,
  onOpenChange,
  onFinish,
}) => {
  const { t } = useTranslation('common')
  return (
    <Dialog
      title={t('billing.title', { defaultValue: 'Billing' })}
      open={open}
      onOpenChange={onOpenChange}
      footer={null}
    >
      <BillingForm
        onFinish={() => {
          onOpenChange?.(false)
          onFinish?.()
        }}
      />
    </Dialog>
  )
}
