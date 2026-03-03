import { toast } from 'sonner'
import { useRequest } from '@/contexts/ApiContext'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { NumberInput } from './ui/NumberInput'
import { Form, FormField, type FormInstance } from './ui/Form'
import { useTranslation } from 'react-i18next'

interface MonthlyFreeAllowanceModalProps {
  form: FormInstance
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export const MonthlyFreeAllowanceModal: React.FC<
  MonthlyFreeAllowanceModalProps
> = ({ open, onOpenChange, onSuccess, form }) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  return (
    <Dialog
      title={t('users.monthlyFreeAllowanceTitle', {
        defaultValue: 'Grant monthly free allowance',
      })}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="flex items-center justify-end gap-4 ">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={() => {
              form.onSubmit(async (values) => {
                const userId = values.id
                if (!userId) {
                  toast.warning('`userId` is empty')
                  return
                }
                request.updateUserMonthlyFreeAllowance
                  .post({
                    monthlyFreeAllowance: values.monthlyFreeAllowance,
                    userId,
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
                    onOpenChange?.(false)
                  })
              })
            }}
          >
            {t('actions.confirm', { defaultValue: 'Confirm' })}
          </Button>
        </div>
      }
    >
      <Form form={form}>
        <FormField
          name="monthlyFreeAllowance"
          label={t('users.monthlyFreeAllowance', {
            defaultValue: 'Monthly free allowance',
          })}
        >
          <NumberInput />
        </FormField>
      </Form>
    </Dialog>
  )
}
