import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Select as RadixSelect } from 'radix-ui'
import React from 'react'
import { cn } from '@/utils/cn'
import { useZIndexStore } from '@/stores/zIndex'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Drawer } from '../Drawer'

export type SelectOption = {
  value: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

interface SelectProps extends Omit<
  RadixSelect.SelectProps,
  'value' | 'defaultValue' | 'onValueChange' | 'children'
> {
  options?: SelectOption[]
  value?: SelectOption['value']
  defaultValue?: SelectOption['value']
  placeholder?: React.ReactNode
  triggerClassName?: string
  contentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onChange?: (value: SelectOption['value']) => void
}

export const Select: React.FC<SelectProps> = ({
  options = [],
  value,
  defaultValue,
  placeholder,
  triggerClassName,
  contentClassName,
  open,
  onOpenChange,
  onChange,
  ...rootProps
}) => {
  const resolvedPlaceholder = placeholder ?? null

  const nextZIndex = useZIndexStore((state) => state.next)
  const [innerOpen, setInnerOpen] = React.useState(false)
  const [contentZIndex, setContentZIndex] = React.useState(50)
  const isOpen = open ?? innerOpen
  const breakpoint = useBreakpoint()

  React.useEffect(() => {
    if (!isOpen) return
    setContentZIndex(nextZIndex())
  }, [isOpen, nextZIndex])

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInnerOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <>
      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onChange}
        open={!breakpoint.md && isOpen}
        onOpenChange={handleOpenChange}
        {...rootProps}
      >
        <RadixSelect.Trigger
          className={cn(
            'inline-flex h-9 w-full min-w-40 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors',
            'hover:border-primary data-placeholder:text-muted-foreground',
            'ring-2 ring-transparent focus-visible:ring-primary/20 focus-visible:border-primary data-[state=open]:ring-primary/20 data-[state=open]:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName
          )}
        >
          <RadixSelect.Value placeholder={resolvedPlaceholder} />
          <RadixSelect.Icon className="text-muted-foreground">
            <ChevronDownIcon className="size-4" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            style={{ zIndex: contentZIndex }}
            className={cn(
              'max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg',
              contentClassName
            )}
          >
            <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-background text-foreground">
              <ChevronUpIcon className="size-4" />
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <div className="flex items-center gap-1">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-popover text-muted-foreground">
              <ChevronDownIcon className="size-4" />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      <Drawer open={breakpoint.md && isOpen} onOpenChange={handleOpenChange}>
        <div className="h-full overflow-y-auto webkit-scrollbar-hidden">
          {options.map((option) => (
            <SelectMDItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              onClick={() => {
                onChange?.(option.value)
                handleOpenChange(false)
              }}
              isChecked={option.value === value}
            >
              <div className="flex items-center gap-1">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectMDItem>
          ))}
        </div>
      </Drawer>
    </>
  )
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ children, className, ...restProps }, forwardedRef) => {
  return (
    <RadixSelect.Item
      className={cn(
        'relative flex h-8 w-full cursor-default select-none items-center rounded-sm py-1 pr-8 pl-8 text-sm outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        'hover:bg-muted data-[state=checked]:bg-primary/20 data-[state=checked]:text-primary',
        className
      )}
      {...restProps}
      ref={forwardedRef}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex w-4 items-center justify-center">
        <CheckIcon className="size-4" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  )
})

const SelectMDItem: React.FC<
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item> & {
    isChecked?: boolean
  }
> = ({ children, className, isChecked, value, ...restProps }) => {
  return (
    <div
      className={cn(
        'relative flex h-8 w-full cursor-default select-none items-center rounded-sm py-1 pr-8 pl-8 text-sm outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        'hover:bg-muted data-[state=checked]:bg-primary/20 data-[state=checked]:text-primary',
        className
      )}
      data-value={value}
      data-state={isChecked ? 'checked' : 'unchecked'}
      {...restProps}
    >
      {children}
      {isChecked && (
        <div className="absolute left-2 inline-flex w-4 items-center justify-center">
          <CheckIcon className="size-4" />
        </div>
      )}
    </div>
  )
}

SelectItem.displayName = 'SelectItem'
SelectMDItem.displayName = 'SelectMDItem'
