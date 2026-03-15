import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import { CheckIcon } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import { useRequest } from '@/contexts/ApiContext'
import { useOrderStatusQuery } from '@/apps/tenant/hooks/queries/useOrderStatus'
import { useTranslation } from 'react-i18next'
import { Button } from '@openproxy/ui/Button'
import { Dialog } from '@openproxy/ui/Dialog'
import { QRCode } from './QRCode'

const amounts = [20, 50, 100, 200]

interface AmountSelectorItemProps {
  label: string | number
  isSelected: boolean
  onSelect: () => void
}

const AmountSelectorItem: React.FC<AmountSelectorItemProps> = ({
  label,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      key={label}
      className={cn(
        'flex items-center justify-center min-w-20 text-center h-10.5 shrink-0 border border-border rounded-md cursor-pointer select-none',
        {
          'bg-primary text-white': isSelected,
        }
      )}
      onClick={onSelect}
    >
      {label}
    </div>
  )
}

interface AmountSelectorProps {
  onValueChange: (value: number) => void
}

const AmountSelector: React.FC<AmountSelectorProps> = ({ onValueChange }) => {
  const { t } = useTranslation('common')
  const [amount, setAmount] = useState(amounts[0])
  const [isCustom, setIsCustom] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    onValueChange(amount)
  }, [amount])
  return (
    <>
      <div className="w-full flex items-center text-6xl font-bold">
        <span className="shrink-0">¥</span>
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            value={amount}
            className={cn(
              'absolute top-0 left-0 w-full bg-primary/10 outline-1 outline-primary h-full',
              isCustom ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onBlur={() => {
              setIsCustom(false)
            }}
            onChange={(e) => {
              const nextAmount = parseInt(e.target.value, 10)
              if (isNaN(nextAmount)) {
                setAmount(0)
                return
              }
              if (nextAmount >= 1000) {
                toast.error(
                  t('billing.maxAmount', {
                    defaultValue: 'Maximum amount is 1000',
                  })
                )
                return
              }
              setAmount(nextAmount)
            }}
          />
          <NumberFlow
            className={cn(
              'cursor-copy',
              !isCustom ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            willChange
            value={amount || 0}
            onClick={() => {
              inputRef.current?.focus()
              setIsCustom(true)
            }}
            format={{ useGrouping: false }}
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {amounts.map((d) => (
          <AmountSelectorItem
            key={d}
            label={`¥${d}`}
            isSelected={amount === d}
            onSelect={() => {
              setAmount(d)
            }}
          />
        ))}
        <AmountSelectorItem
          label={t('common.custom', { defaultValue: 'Custom' })}
          isSelected={!amounts.includes(amount)}
          onSelect={() => {
            inputRef.current?.focus()
            setIsCustom(true)
          }}
        />
      </div>
    </>
  )
}

const paymentTypes = [
  {
    key: 'alipay',
    label: 'Alipay',
    icon: <img src="/alipay.png" className="w-6 h-6 select-none" />,
  },
]

const PaymentTypeSelector = () => {
  const [selelctedPaymentType, setSelectedPaymentType] = useState(
    paymentTypes[0].key
  )
  return (
    <div className="flex items-center gap-6">
      {paymentTypes.map((type) => (
        <div
          key={type.key}
          className={cn(
            'relative shrink-0 flex items-center py-2 px-4 gap-2 border border-border rounded-md cursor-pointer outline-none transition-colors select-none whitespace-nowrap',
            selelctedPaymentType === type.key
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary hover:bg-primary/5'
          )}
          onClick={() => {
            setSelectedPaymentType(type.key)
          }}
        >
          {type.icon}
          <div className="text-md!">{type.label}</div>

          <div
            className={cn(
              'p-0.5  rounded-full',
              selelctedPaymentType === type.key
                ? 'bg-primary text-white'
                : 'bg-muted text-transparent'
            )}
          >
            <CheckIcon className="w-3 h-3" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface BillingFormProps {
  onFinish?: () => void
}

export const BillingForm: React.FC<BillingFormProps> = ({ onFinish }) => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const [amount, setAmount] = useState<number>(20)
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const orderId = useMemo(() => {
    try {
      const url = new URL(qrCodeUrl)
      const outTradeNo = url.searchParams.get('out_trade_no')
      return outTradeNo
    } catch {
      return null
    }
  }, [qrCodeUrl])

  const orderStatusQuery = useOrderStatusQuery({ orderId: orderId || '' })

  const qrCodeStatus = useMemo(() => {
    const orderStatus = orderStatusQuery.data
    return orderStatus
  }, [orderStatusQuery])

  useEffect(() => {
    if (qrCodeStatus === 2) {
      setQrCodeUrl('')
      onFinish?.()
    }
  }, [qrCodeStatus])

  const onSubmit = async () => {
    setLoading(true)
    await request.pay.qrCodeUrl
      .post({
        amount,
        type: 'alipay',
      })
      .then((res) => {
        if (res.error) {
          const message = (res.error.value as any)?.message
          toast.error(
            message ||
              t('common.operationFailedWithStatus', {
                defaultValue: `Operation failed: ${res.error.status}`,
                status: res.error.status,
              })
          )
          return
        }
        setQrCodeUrl(res.data)
      })
    setLoading(false)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <AmountSelector onValueChange={setAmount} />
        <PaymentTypeSelector />
        <Button className="w-full" onClick={onSubmit} loading={loading}>
          {t('billing.confirmPayment', { defaultValue: 'Confirm payment' })}
        </Button>
      </div>

      <Dialog
        width={320}
        open={Boolean(qrCodeUrl)}
        onOpenChange={(open) => {
          if (!open) {
            setQrCodeUrl('')
          }
        }}
        footer={null}
        overlayProps={{ className: 'z-1000' }}
        contentProps={{ className: 'z-1000' }}
      >
        <div className="flex flex-col items-center justify-center min-h-32">
          <div className="flex items-center gap-2 mb-4">
            <img className="w-6 h-6" src="/alipay.png" />
            <span>{t('billing.alipay', { defaultValue: 'Alipay' })}</span>
          </div>

          <BillingQRCode qrCodeUrl={qrCodeUrl} />
          <span className="text-xs font-medium opacity-50 mt-1">
            {t('billing.scanHint', {
              defaultValue: 'Open Alipay on your phone and scan to pay',
            })}
          </span>

          <div className="w-full border-b-2 border-border border-dashed my-4" />

          <div className="w-full flex items-end justify-between">
            <span>{t('billing.amount', { defaultValue: 'Amount' })}</span>
            <span className="text-red-600 text-2xl font-bold mx-2">
              ¥{amount}
            </span>
          </div>

          <div className="w-full mt-4">
            <Button
              className="w-full"
              onClick={() => {
                setQrCodeUrl('')
                onFinish?.()
              }}
            >
              {t('billing.finishPayment', { defaultValue: 'Payment finished' })}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

interface BillingQRCodeProps {
  qrCodeUrl: string
}

export const BillingQRCode: React.FC<BillingQRCodeProps> = ({ qrCodeUrl }) => {
  return <QRCode size={240} value={qrCodeUrl} />
}
