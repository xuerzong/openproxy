import { useId } from 'react'
import { Checkbox as RadixCheckbox, Slot } from 'radix-ui'
import { CheckIcon, MinusIcon } from 'lucide-react'
import s from './index.module.scss'
import { cn } from '@/utils/cn'

export type CheckedState = RadixCheckbox.CheckedState

interface CheckboxProps {
  label?: React.ReactNode
  checked?: RadixCheckbox.CheckedState
  onCheckedChange?: (checked: RadixCheckbox.CheckedState) => void
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onCheckedChange,
}) => {
  const id = useId()
  return (
    <div className="flex items-center gap-1 cursor-pointer">
      <RadixCheckbox.Root
        id={id}
        className={cn(
          s.Checkbox,
          'flex items-center justify-center w-5 h-5 bg-background border border-border rounded-md'
        )}
        onCheckedChange={onCheckedChange}
        checked={checked}
      >
        <RadixCheckbox.Indicator>
          <Slot.Root className="w-4 h-4">
            {checked === 'indeterminate' ? <MinusIcon /> : <CheckIcon />}
          </Slot.Root>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {Boolean(label) && (
        <label
          htmlFor={id}
          className="inline-block text-sm select-none cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  )
}

export interface CheckboxOption {
  label: React.ReactNode
  value: string
}

export interface CheckboxGroupProps {
  value?: string[]
  onChange?: (value?: string[]) => void
  options: CheckboxOption[]
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-4">
      {options.map((opt) => (
        <Checkbox
          key={opt.value}
          checked={value?.includes(opt.value)}
          onCheckedChange={(checked) => {
            if (checked) {
              onChange?.([...(value || []), opt.value])
            } else {
              onChange?.(value?.filter((v) => v !== opt.value))
            }
          }}
          label={opt.label}
        />
      ))}
    </div>
  )
}
