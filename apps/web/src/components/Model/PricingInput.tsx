import { NumberInput } from '@openproxy/ui/NumberInput'
import { useTranslation } from 'react-i18next'
import { TierList, type PricingTier } from './TierList'

export type { PricingTier }

export interface PricingInputProps {
  value?: {
    output: string
    input: string
    input_cache_read: string
    output_tiers?: PricingTier[]
    input_cache_read_tiers?: PricingTier[]
  }
  onChange?: (value: PricingInputProps['value']) => void
}

export const PricingInput: React.FC<PricingInputProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation('common')
  const onTriggerChange = (newValue: Partial<PricingInputProps['value']>) => {
    onChange?.({
      input: '0',
      output: '0',
      input_cache_read: '0',
      ...(value || {}),
      ...newValue,
    })
  }
  const input = value && value.input ? Number(value.input) : void 0
  const output = value && value.output ? Number(value.output) : void 0
  const inputCacheRead =
    value && value.input_cache_read ? Number(value.input_cache_read) : void 0

  const updateTier = (
    fieldName: 'output_tiers' | 'input_cache_read_tiers',
    index: number,
    key: keyof PricingTier,
    val: string | number | undefined
  ) => {
    const tiers = [...(value?.[fieldName] || [])]
    tiers[index] = { ...tiers[index], [key]: val }
    onTriggerChange({ [fieldName]: tiers })
  }

  const addTier = (fieldName: 'output_tiers' | 'input_cache_read_tiers') => {
    const tiers = [...(value?.[fieldName] || [])]
    tiers.push({ cost: '0' })
    onTriggerChange({ [fieldName]: tiers })
  }

  const removeTier = (
    fieldName: 'output_tiers' | 'input_cache_read_tiers',
    index: number
  ) => {
    const tiers = [...(value?.[fieldName] || [])]
    tiers.splice(index, 1)
    onTriggerChange({ [fieldName]: tiers.length > 0 ? tiers : undefined })
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <NumberInput
          inputProps={{
            placeholder: '0.00',
          }}
          value={input}
          onChange={(e) => {
            onTriggerChange({ input: e != null ? e.toString() : '0' })
          }}
          min={0}
          precision={2}
        />
        <NumberInput
          inputProps={{
            placeholder: '0.00',
          }}
          value={output}
          onChange={(e) => {
            onTriggerChange({ output: e != null ? e.toString() : '0' })
          }}
          min={0}
          precision={2}
        />
        <NumberInput
          inputProps={{
            placeholder: '0.00',
          }}
          value={inputCacheRead}
          onChange={(e) => {
            onTriggerChange({ input_cache_read: e != null ? e.toString() : '0' })
          }}
          min={0}
          precision={2}
        />
      </div>
      <TierList
        label={t('models.outputTiers', { defaultValue: 'Output Tiers' })}
        tiers={value?.output_tiers || []}
        onAdd={() => addTier('output_tiers')}
        onUpdate={(idx, key, val) => updateTier('output_tiers', idx, key, val)}
        onRemove={(idx) => removeTier('output_tiers', idx)}
      />
      <TierList
        label={t('models.inputCacheReadTiers', {
          defaultValue: 'Input Cache Read Tiers',
        })}
        tiers={value?.input_cache_read_tiers || []}
        onAdd={() => addTier('input_cache_read_tiers')}
        onUpdate={(idx, key, val) =>
          updateTier('input_cache_read_tiers', idx, key, val)
        }
        onRemove={(idx) => removeTier('input_cache_read_tiers', idx)}
      />
    </div>
  )
}
