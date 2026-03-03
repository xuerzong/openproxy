import { useUserConfigQuery } from '@/apps/tenant/hooks/queries/useUserConfigQuery'
import { useTranslation } from 'react-i18next'

export const MonthlyFreeQuota = () => {
  const { t } = useTranslation('common')
  const userConfigQuery = useUserConfigQuery()
  const monthlyFreeUsed = userConfigQuery.data?.monthlyFreeUsed || '0.00'
  const monthlyFreeAllowance =
    userConfigQuery.data?.monthlyFreeAllowance || '0.00'
  const percent = Math.floor(
    (Number(monthlyFreeUsed) / Number(monthlyFreeAllowance)) * 100
  )

  if (Number(monthlyFreeAllowance) === 0) return null

  return (
    <div className="gap-1 bg-primary/10 border border-primary rounded-md py-2 px-4">
      <div className="flex items-center justify-start gap-2">
        <span className="text-xs">
          {t('users.monthlyFreeAllowance', {
            defaultValue: 'Monthly free allowance',
          })}
        </span>
      </div>

      <div className="relative w-full h-1.5 bg-primary/30 rounded-full overflow-hidden">
        <div
          style={{ width: `${percent}%` }}
          className="absolute top-0 left-0 h-full bg-primary"
        />
      </div>

      <div className="text-xs">
        <span>¥{monthlyFreeUsed}</span>
        <span>/</span>
        <span>¥{monthlyFreeAllowance}</span>
      </div>
    </div>
  )
}
