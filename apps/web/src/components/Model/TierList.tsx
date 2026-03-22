import { PlusIcon, Trash2Icon } from 'lucide-react'
import { NumberInput } from '@openproxy/ui/NumberInput'
import { FormLabel } from '@openproxy/ui/Form'
import { Button } from '@openproxy/ui/Button'
import { Tooltip } from '@openproxy/ui/Tooltip'
import { useTranslation } from 'react-i18next'

export interface PricingTier {
  cost: string
  min?: number
  max?: number
}

interface TierRowProps {
  tier: PricingTier
  onChange: (key: keyof PricingTier, val: string | number | undefined) => void
  onDelete: () => void
}

export const TierRow: React.FC<TierRowProps> = ({
  tier,
  onChange,
  onDelete,
}) => {
  const { t } = useTranslation('common')
  return (
    <div className="flex items-center gap-2 mb-1">
      <NumberInput
        inputProps={{
          placeholder: t('models.tierCost', { defaultValue: 'Cost' }),
        }}
        value={tier.cost ? Number(tier.cost) : void 0}
        onChange={(e) => onChange('cost', e != null ? e.toString() : '0')}
        min={0}
        precision={2}
      />
      <NumberInput
        inputProps={{
          placeholder: t('models.tierMin', { defaultValue: 'Min tokens' }),
        }}
        value={tier.min}
        onChange={(e) => onChange('min', e != null ? Number(e) : undefined)}
        min={0}
      />
      <NumberInput
        inputProps={{
          placeholder: t('models.tierMax', { defaultValue: 'Max tokens' }),
        }}
        value={tier.max}
        onChange={(e) => onChange('max', e != null ? Number(e) : undefined)}
        min={0}
      />
      <Tooltip content={t('actions.delete', { defaultValue: 'Delete' })}>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onDelete}>
          <Trash2Icon className="size-4" />
        </Button>
      </Tooltip>
    </div>
  )
}

interface TierListProps {
  label: string
  tiers: PricingTier[]
  onAdd: () => void
  onUpdate: (
    index: number,
    key: keyof PricingTier,
    val: string | number | undefined
  ) => void
  onRemove: (index: number) => void
}

export const TierList: React.FC<TierListProps> = ({
  label,
  tiers,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation('common')
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <FormLabel>{label}</FormLabel>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <PlusIcon className="size-4" />
          {t('actions.add', { defaultValue: 'Add' })}
        </Button>
      </div>
      {tiers.map((tier, idx) => (
        <TierRow
          key={idx}
          tier={tier}
          onChange={(key, val) => onUpdate(idx, key, val)}
          onDelete={() => onRemove(idx)}
        />
      ))}
    </div>
  )
}
