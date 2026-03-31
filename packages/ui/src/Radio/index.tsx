import { RadioGroup as RadixRadioGroup, Slot } from 'radix-ui'
import { useId } from 'react'

interface RadioOption {
  value: string | number | boolean
  label: React.ReactNode
}

interface RadioItemProps extends RadioOption {}

export const RadioItem: React.FC<RadioItemProps> = ({ value, label }) => {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <RadixRadioGroup.Item
        className="relative w-4 h-4 bg-primary/20 rounded-full border border-border cursor-pointer"
        value={value.toString()}
        id={id}
      >
        <RadixRadioGroup.Indicator className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] block w-2 h-2 rounded-full bg-primary" />
      </RadixRadioGroup.Item>
      <label htmlFor={id}>{label}</label>
    </div>
  )
}

export interface RadioGroupProps extends Omit<
  RadixRadioGroup.RadioGroupProps,
  'onChange' | 'value'
> {
  onChange?: (value: string | number | boolean) => void
  value?: string
  options: RadioOption[]
  valueType?: 'number' | 'string' | 'boolean'
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  onChange,
  value,
  valueType = 'string',
  ...restProps
}) => {
  return (
    <RadixRadioGroup.Root
      className="flex gap-2 flex-wrap"
      {...restProps}
      value={value?.toString()}
      onValueChange={(e) => {
        if (valueType === 'number' && !isNaN(Number(e))) {
          onChange?.(Number(e))
        } else if (valueType === 'boolean' && ['true', 'false'].includes(e)) {
          onChange?.(e === 'true' ? true : false)
        } else {
          onChange?.(e)
        }
      }}
    >
      {options.map((opt) => (
        <RadioItem key={opt.value.toString()} {...opt} />
      ))}
    </RadixRadioGroup.Root>
  )
}
