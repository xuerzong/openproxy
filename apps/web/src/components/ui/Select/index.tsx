import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Select as RadixSelect } from 'radix-ui'
import React from 'react'
import { cn } from '@/utils/cn'
import { useZIndexStore } from '@/stores/zIndex'

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
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      open={isOpen}
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
                {option.icon && (
                  <span className="mr-2 flex h-4 w-4 items-center justify-center">
                    {option.icon}
                  </span>
                )}
                {option.label}
              </SelectItem>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-popover text-muted-foreground">
            <ChevronDownIcon className="size-4" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(({ children, className, ...props }, forwardedRef) => {
  return (
    <RadixSelect.Item
      className={cn(
        'relative flex h-8 w-full cursor-default select-none items-center rounded-sm py-1 pr-8 pl-8 text-sm outline-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        'hover:bg-muted data-[state=checked]:bg-primary/20 data-[state=checked]:text-primary',
        className
      )}
      {...props}
      ref={forwardedRef}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex w-4 items-center justify-center">
        <CheckIcon className="size-4" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  )
})

SelectItem.displayName = 'SelectItem'
