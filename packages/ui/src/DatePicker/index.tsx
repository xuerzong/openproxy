import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  XIcon,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Popover as RadixPopover } from 'radix-ui'
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale as DayPickerLocale,
} from 'react-day-picker'
import { enUS, zhCN } from 'react-day-picker/locale'
import { Button, buttonVariants } from '../Button'
import { inputVariants, Input } from '../Input'
import { cn } from '../utils/cn'
import { useZIndexStore } from '../stores/zIndex'

dayjs.extend(customParseFormat)

const OUTPUT_FORMAT = 'YYYY-MM-DDTHH:mm'
const DISPLAY_FORMAT = 'YYYY-MM-DD HH:mm'
const TIME_FORMAT = 'HH:mm'
const DEFAULT_TIME = '00:00'

const detectLocaleCode = () => {
  if (typeof document !== 'undefined' && document.documentElement.lang) {
    return document.documentElement.lang
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }

  return 'en-US'
}

const resolveDayPickerLocale = (localeCode?: string): DayPickerLocale => {
  return localeCode?.toLowerCase().startsWith('zh') ? zhCN : enUS
}

const resolveDayjsLocale = (localeCode?: string) => {
  return localeCode?.toLowerCase().startsWith('zh') ? 'zh-cn' : 'en'
}

const parseValue = (value?: string | null, localeCode?: string) => {
  if (!value) {
    return null
  }

  const dayjsLocale = resolveDayjsLocale(localeCode)
  const formats = [OUTPUT_FORMAT, DISPLAY_FORMAT, 'YYYY-MM-DD HH:mm:ss']

  for (const format of formats) {
    const parsed = dayjs(value, format, dayjsLocale, true)
    if (parsed.isValid()) {
      return parsed.locale(dayjsLocale)
    }
  }

  const fallback = dayjs(value)
  return fallback.isValid() ? fallback.locale(dayjsLocale) : null
}

export interface DatePickerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'name'
> {
  value?: string | null
  onChange?: (value: string | undefined) => void
  status?: 'default' | 'danger'
  size?: 'sm' | 'md'
  localeCode?: string
  name?: string
  placeholder?: string
  allowClear?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const parseTimeValue = (value: string) => {
  const [rawHour = '0', rawMinute = '0'] = value.split(':')
  const hour = Number.parseInt(rawHour, 10)
  const minute = Number.parseInt(rawMinute, 10)

  return {
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  }
}

const buildDateTime = (date: Date, time: string, localeCode?: string) => {
  const { hour, minute } = parseTimeValue(time)

  return dayjs(date)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .locale(resolveDayjsLocale(localeCode))
}

const CalendarDayButton = ({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  locale?: Partial<DayPickerLocale>
}) => {
  const defaultClassNames = getDefaultClassNames()
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'relative isolate z-10 flex aspect-square h-full w-full items-center justify-center rounded-[var(--cell-radius)] text-sm leading-none font-normal transition-colors',
        'group-data-[focused=true]/day:outline-none group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-primary/20',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
        'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground',
        'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground',
        'data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

const CalendarPanel = ({
  selected,
  defaultMonth,
  onSelect,
  locale,
}: {
  selected?: Date
  defaultMonth?: Date
  onSelect: (date: Date | undefined) => void
  locale: DayPickerLocale
}) => {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      mode="single"
      showOutsideDays
      selected={selected}
      defaultMonth={defaultMonth}
      onSelect={onSelect}
      locale={locale}
      className={cn(
        'group/calendar bg-background p-2 [--cell-radius:0.5rem] [--cell-size:2.25rem]'
      )}
      classNames={{
        root: cn(defaultClassNames.root),
        months: cn('flex flex-col', defaultClassNames.months),
        month: cn('flex flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-2 px-2 z-1 flex items-center justify-between gap-1',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'relative flex h-[var(--cell-size)] items-center justify-center px-[var(--cell-size)]',
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          'text-sm font-medium select-none',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('mt-2 flex', defaultClassNames.weekdays),
        weekday: cn(
          'flex-1 text-center text-[0.8rem] font-normal text-foreground/50 select-none',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full justify-between', defaultClassNames.week),
        day: cn('relative aspect-square', defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          defaultClassNames.day_button
        ),
        selected: cn(
          buttonVariants({ variant: 'default', size: 'icon' }),
          defaultClassNames.selected
        ),
        today: cn(
          'rounded-[var(--cell-radius)] bg-muted text-foreground',
          defaultClassNames.today
        ),
        outside: cn(
          'text-foreground/35 aria-selected:text-foreground/35',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-foreground/25 opacity-60',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return (
              <ChevronLeftIcon className={cn('size-4', className)} {...props} />
            )
          }

          if (orientation === 'right') {
            return (
              <ChevronRightIcon
                className={cn('size-4', className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn('size-4', className)} {...props} />
          )
        },
        DayButton: (props) => <CalendarDayButton locale={locale} {...props} />,
      }}
    />
  )
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      status = 'default',
      size = 'md',
      localeCode,
      className,
      allowClear = true,
      placeholder,
      disabled,
      open,
      onOpenChange,
      name,
      id,
      type,
      ...buttonProps
    },
    ref
  ) => {
    const nextZIndex = useZIndexStore((state) => state.next)
    const [innerOpen, setInnerOpen] = useState(false)
    const [popupZIndex, setPopupZIndex] = useState(1000)
    const [draftTime, setDraftTime] = useState(DEFAULT_TIME)
    const isOpen = open ?? innerOpen
    const currentValue = value ?? null
    const resolvedLocaleCode = localeCode || detectLocaleCode()
    const dayPickerLocale = useMemo(
      () => resolveDayPickerLocale(resolvedLocaleCode),
      [resolvedLocaleCode]
    )
    const parsedValue = useMemo(
      () => parseValue(currentValue, resolvedLocaleCode),
      [currentValue, resolvedLocaleCode]
    )
    const displayValue = useMemo(() => {
      return parsedValue?.format(DISPLAY_FORMAT) ?? ''
    }, [parsedValue])
    const selectedDate = parsedValue?.toDate()
    const defaultMonth = selectedDate ?? new Date()

    useEffect(() => {
      if (!isOpen) return
      setPopupZIndex(nextZIndex())
    }, [isOpen, nextZIndex])

    useEffect(() => {
      if (!isOpen) return
      setDraftTime(parsedValue?.format(TIME_FORMAT) ?? DEFAULT_TIME)
    }, [isOpen, parsedValue])

    const handleOpenChange = (nextOpen: boolean) => {
      if (open === undefined) {
        setInnerOpen(nextOpen)
      }

      onOpenChange?.(nextOpen)
    }

    const emitChange = (nextValue: Dayjs | null | undefined) => {
      const formattedValue = nextValue
        ? nextValue
            .locale(resolveDayjsLocale(resolvedLocaleCode))
            .format(OUTPUT_FORMAT)
        : undefined

      onChange?.(formattedValue)
    }

    const clearValue = () => {
      emitChange(undefined)
      handleOpenChange(false)
    }

    const handleDateSelect = (nextDate: Date | undefined) => {
      if (!nextDate) return
      emitChange(buildDateTime(nextDate, draftTime, resolvedLocaleCode))
    }

    const handleTimeChange = (nextTime: string) => {
      setDraftTime(nextTime)

      if (!parsedValue) {
        return
      }

      emitChange(
        buildDateTime(parsedValue.toDate(), nextTime, resolvedLocaleCode)
      )
    }

    const handleClearClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      clearValue()
    }

    return (
      <div className="relative w-full">
        {name && <input type="hidden" name={name} value={currentValue ?? ''} />}
        <RadixPopover.Root open={isOpen} onOpenChange={handleOpenChange}>
          <RadixPopover.Trigger asChild>
            <button
              ref={ref}
              id={id}
              disabled={disabled}
              type={type ?? 'button'}
              className={cn(
                inputVariants({ status }),
                'flex w-full items-center justify-between gap-2 bg-background pr-18 text-left text-sm font-normal',
                size === 'sm'
                  ? 'h-8 px-3 pr-16 text-[0.8rem]'
                  : 'h-10 px-4 pr-18',
                !parsedValue && 'text-foreground/45',
                className
              )}
              {...buttonProps}
            >
              <span className="truncate">{displayValue || placeholder}</span>
              <CalendarDaysIcon className="absolute right-3 size-4 text-foreground/45" />
            </button>
          </RadixPopover.Trigger>
          {allowClear && parsedValue && !disabled && (
            <Button
              className="absolute top-1/2 right-9 -translate-y-1/2"
              variant="ghost"
              size="icon-sm"
              onClick={handleClearClick}
            >
              <XIcon />
            </Button>
          )}
          <RadixPopover.Portal>
            <RadixPopover.Content
              side="bottom"
              sideOffset={6}
              align="start"
              avoidCollisions
              collisionPadding={8}
              style={{ zIndex: popupZIndex }}
              className="z-50 flex w-auto min-w-[20rem] origin-[--radix-popover-content-transform-origin] flex-col overflow-hidden rounded-lg bg-background text-sm text-foreground shadow-xl ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              <CalendarPanel
                selected={selectedDate}
                defaultMonth={defaultMonth}
                onSelect={handleDateSelect}
                locale={dayPickerLocale}
              />
              <div className="flex items-end gap-3 border-t border-border p-3">
                <div className="flex-1">
                  <div className="mb-1 text-xs font-medium text-foreground/60">
                    Time
                  </div>
                  <Input
                    type="time"
                    step="60"
                    value={draftTime}
                    onChange={(event) =>
                      handleTimeChange(event.target.value || DEFAULT_TIME)
                    }
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    suffix={
                      <Clock3Icon className="size-4 text-foreground/45" />
                    }
                  />
                </div>
              </div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
