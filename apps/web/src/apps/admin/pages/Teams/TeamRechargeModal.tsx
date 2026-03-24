import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogFooter } from '@openproxy/ui/Dialog'
import { NumberInput } from '@openproxy/ui/NumberInput'
import { useRequest } from '@/contexts/ApiContext'
import { getToastRequestStatus, toastApiPromise } from '@/utils/toast'

interface TeamRechargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team: any | null
  onSuccess?: (team: any) => void
}

export const TeamRechargeModal: React.FC<TeamRechargeModalProps> = ({
  open,
  onOpenChange,
  team,
  onSuccess,
}) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [amount, setAmount] = useState(100)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setAmount(100)
      setLoading(false)
    }
  }, [open])

  const onRechargeTeam = async () => {
    if (!team || loading || amount <= 0) {
      return
    }

    setLoading(true)

    void toastApiPromise(
      request.admin.teams.recharge.post({
        id: team.id,
        amount,
      }),
      {
        loading: t('common.processing', {
          defaultValue: 'Processing...',
        }),
        success: t('teams.messages.rechargeSuccess', {
          defaultValue: 'Team recharged successfully',
        }),
        error: (error) =>
          t('common.operationFailedWithStatus', {
            defaultValue: `Operation failed: ${getToastRequestStatus(error)}`,
            status: getToastRequestStatus(error),
          }),
        onSuccess: (data) => {
          onSuccess?.(data)
          onOpenChange(false)
        },
        onError: () => {
          setLoading(false)
        },
      }
    ).finally(() => {
      setLoading(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('teams.recharge.title', {
        defaultValue: 'Direct Recharge',
      })}
      description={t('teams.recharge.description', {
        defaultValue:
          'Recharge the team balance directly from the admin panel.',
      })}
      footer={
        <DialogFooter
          locale={{
            cancelText: t('actions.cancel', { defaultValue: 'Cancel' }),
            confirmText: t('actions.confirm', { defaultValue: 'Confirm' }),
          }}
          onCancel={() => onOpenChange(false)}
          onOk={onRechargeTeam}
          okText={t('teams.actions.recharge', {
            defaultValue: 'Recharge',
          })}
          okButtonProps={{
            loading,
            disabled: amount <= 0,
          }}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.name', { defaultValue: 'Name' })}
            </div>
            <div>{team?.name || '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t('teams.table.amount', { defaultValue: 'Balance' })}
            </div>
            <div>{team?.amount || '0.00'}</div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-1">
            {t('teams.recharge.amount', {
              defaultValue: 'Recharge Amount',
            })}
          </div>
          <NumberInput
            min={0.01}
            precision={2}
            step={10}
            value={amount}
            onChange={(value) => setAmount(value ?? 0)}
          />
        </div>
      </div>
    </Dialog>
  )
}
