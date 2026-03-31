import { NumberField } from '@base-ui/react/number-field'
import { type ComponentProps, useEffect, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '../utils/cn'

import type { InputProps } from '../Input'
import { mergeProps } from '../utils/props'

type NumberFieldRootProps = Omit<
  ComponentProps<typeof NumberField.Root>,
  | 'children'
  | 'className'
  | 'value'
  | 'defaultValue'
  | 'format'
  | 'onValueChange'
  | 'onValueCommitted'
>

type NumberFieldRootClickEvent = Parameters<
  NonNullable<ComponentProps<typeof NumberField.Root>['onClick']>
>[0]

export interface NumberInputProps extends NumberFieldRootProps {
  value?: number
  onChange?: (value: number | undefined) => void
  size?: 'sm' | 'md'
  inputProps?: InputProps
  precision?: number
  status?: 'default' | 'danger'
}

export const NumberInput: React.FC<NumberInputProps> = ({
  disabled = false,
  min = 0,
  max,
  readOnly = false,
  required = false,
  id,
  name,
  value: propsValue,
  onChange,
  size,
  inputProps,
  precision = 0,
  step = 1,
  status = 'default',
  ...restProps
}) => {
  const [hasFocused, setHasFocused] = useState(false)
  const [fieldKey, setFieldKey] = useState(0)
  const resolvedStep =
    typeof step === 'number'
      ? step > 0
        ? step
        : 1 / Math.pow(10, precision)
      : step
  const mergedInputProps = mergeProps(
    {
      className: cn(
        'h-full w-full border-none bg-transparent px-4 outline-none tabular-nums',
        size === 'sm' ? 'text-xs' : 'text-sm'
      ),
    },
    {
      ...(inputProps || {}),
      suffix: undefined,
      status: undefined,
      disabled: undefined,
      readOnly: undefined,
      required: undefined,
      name: undefined,
      value: undefined,
      defaultValue: undefined,
      onChange: undefined,
      type: undefined,
    }
  )

  useEffect(() => {
    if (!hasFocused) {
      setFieldKey((prev) => prev + 1)
    }
  }, [propsValue, hasFocused, min, max, precision, resolvedStep])

  const emitChange = (nextValue: number | null) => {
    onChange?.(nextValue ?? undefined)
  }

  const handleValueChange = (nextValue: number | null) => {
    emitChange(nextValue)
  }

  const handleValueCommitted = (nextValue: number | null) => {
    emitChange(nextValue)
  }

  const mergedRootProps = mergeProps(restProps, {
    id,
    name,
    min,
    max,
    disabled,
    readOnly,
    required,
    step: resolvedStep,
    defaultValue: propsValue,
    format: {
      useGrouping: false,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    },
    onValueChange: handleValueChange,
    onValueCommitted: handleValueCommitted,
    className: cn(
      'relative w-full border ring-2 ring-transparent outline-none rounded-md transition-colors duration-300',
      'overflow-hidden',
      size === 'sm' ? 'h-8' : 'h-10',
      status === 'danger'
        ? hasFocused
          ? 'border-danger ring-danger/20'
          : 'border-danger hover:border-danger hover:ring-transparent'
        : hasFocused
          ? 'border-primary ring-primary/20'
          : 'border-border hover:border-primary hover:ring-transparent',
      'data-[disabled]:bg-muted data-[disabled]:text-foreground/75'
    ),
    'data-size': size,
    onClick: (e: NumberFieldRootClickEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
  })

  return (
    <NumberField.Root key={fieldKey} {...mergedRootProps}>
      <NumberField.Group className="flex h-full w-full items-stretch">
        <NumberField.Input
          {...mergedInputProps}
          onFocus={(e) => {
            setHasFocused(!disabled)
            inputProps?.onFocus?.(e)
          }}
          onBlur={(e) => {
            setHasFocused(false)
            inputProps?.onBlur?.(e)
          }}
        />
        <div
          className="flex h-full w-8 shrink-0 flex-col border-l border-border select-none"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <NumberField.Increment className="flex flex-1 items-center justify-center bg-background outline-none transition-colors duration-300 hover:bg-muted disabled:cursor-not-allowed disabled:bg-muted">
            <ChevronUpIcon className="h-4 w-4" />
          </NumberField.Increment>
          <NumberField.Decrement className="flex flex-1 items-center justify-center border-t border-border bg-background outline-none transition-colors duration-300 hover:bg-muted disabled:cursor-not-allowed disabled:bg-muted">
            <ChevronDownIcon className="h-4 w-4" />
          </NumberField.Decrement>
        </div>
      </NumberField.Group>
    </NumberField.Root>
  )
}
