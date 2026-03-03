import { Slot } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

import type { InputProps } from '../Input'
import { Button } from '../Button'

interface NumberInputProps {
  min?: number
  max?: number
  disabled?: boolean
  value?: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  inputProps?: InputProps
  precision?: number
  step?: number
}

const formatDisplayValue = (
  value = '',
  min = 0,
  max?: number,
  precision = 0
) => {
  if (!value) return ''
  let nextValue = parseFloat(value || '0')
  if (isNaN(nextValue)) {
    return ''
  }
  nextValue = Math.max(nextValue, min)
  if (max !== undefined) {
    nextValue = Math.min(nextValue, max)
  }
  return precision > 0
    ? nextValue.toFixed(precision)
    : Math.round(nextValue).toString()
}

const formatNumberValue = (
  value = '',
  min = 0,
  max?: number,
  precision = 0
): number => {
  if (!value) return 0
  let nextValue = parseFloat(value || '0')
  if (isNaN(nextValue)) {
    return 0
  }
  nextValue = Math.max(nextValue, min)
  if (max !== undefined) {
    nextValue = Math.min(nextValue, max)
  }
  return precision > 0
    ? parseFloat(nextValue.toFixed(precision))
    : Math.round(nextValue)
}

export const NumberInput: React.FC<NumberInputProps> = ({
  disabled = false,
  min = 0,
  max,
  value: propsValue,
  onChange,
  size,
  inputProps,
  precision = 0,
  step = 1,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasFocused, setHasFocused] = useState(false)
  const [displayValue, setDisplayValue] = useState(
    propsValue !== undefined
      ? formatDisplayValue(propsValue.toString(), min, max, precision)
      : ''
  )
  const blurTimer = useRef<any>(null)

  // Sync with external value
  useEffect(() => {
    if (!hasFocused && propsValue !== undefined) {
      setDisplayValue(
        formatDisplayValue(propsValue.toString(), min, max, precision)
      )
    }
  }, [propsValue, hasFocused, min, max, precision])

  const doFormat = (val: string) => {
    const displayFormatted = formatDisplayValue(val, min, max, precision)
    const numberFormatted = formatNumberValue(val, min, max, precision)
    setDisplayValue(displayFormatted)
    onChange?.(numberFormatted)
  }

  const onAdd = () => {
    const stepValue = step > 0 ? step : 1 / Math.pow(10, precision)
    doFormat((Number(displayValue || 0) + stepValue).toString())
    clearTimeout(blurTimer.current)
    inputRef.current?.focus()
  }

  const onDec = () => {
    const stepValue = step > 0 ? step : 1 / Math.pow(10, precision)
    doFormat((Number(displayValue || 0) - stepValue).toString())
    clearTimeout(blurTimer.current)
    inputRef.current?.focus()
  }

  const handleChange = (newValue: string) => {
    // Allow intermediate states during typing (like "8.", "8.0")
    if (precision > 0) {
      // Allow empty, digits, and one decimal point with optional digits after
      const isValidIntermediate = /^\d*\.?\d*$/.test(newValue)
      if (isValidIntermediate) {
        setDisplayValue(newValue)
        // Only notify parent on valid complete numbers
        if (newValue !== '' && newValue !== '.' && !newValue.endsWith('.')) {
          onChange?.(formatNumberValue(newValue, min, max, precision))
        }
        return
      }
    } else {
      // For integer mode, only allow digits
      if (/^\d*$/.test(newValue)) {
        setDisplayValue(newValue)
        onChange?.(formatNumberValue(newValue, min, max, precision))
        return
      }
    }
  }

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => {
      setHasFocused(false)
      // Format on blur
      doFormat(displayValue)
    }, 50)
  }

  useEffect(() => {
    const keyEvent = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') {
        onAdd()
      }

      if (e.code === 'ArrowDown') {
        onDec()
      }
    }
    if (hasFocused) {
      document.addEventListener('keydown', keyEvent)
    }

    return () => {
      return document.removeEventListener('keydown', keyEvent)
    }
  }, [hasFocused, onAdd, onDec])

  return (
    <div
      className={cn(
        'relative w-full h-10 px-4 text-sm border ring-2 outline-none rounded-md',
        'hover:border-primary hover:ring-transparent',
        'disabled:hover:border-border! disabled:bg-muted disabled:text-foreground/75',
        'overflow-hidden',
        hasFocused
          ? 'border-primary ring-primary/20'
          : 'border-border ring-transparent'
      )}
      data-size={size}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div
        className="absolute right-0 top-[50%] -translate-y-[50%] h-full border-l border-border flex flex-col select-none"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <Button
          size="icon-xs"
          variant="ghost"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAdd()
          }}
        >
          <ChevronUpIcon />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDec()
          }}
        >
          <ChevronDownIcon />
        </Button>
      </div>
      <Slot.Root {...inputProps}>
        <input
          className="h-full w-full outline-none border-none"
          ref={inputRef}
          onFocus={() => {
            setHasFocused(!disabled && true)
          }}
          onBlur={handleBlur}
          value={displayValue}
          onChange={(e) => {
            handleChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
              e.preventDefault()
            }
          }}
          disabled={disabled}
        />
      </Slot.Root>
    </div>
  )
}
