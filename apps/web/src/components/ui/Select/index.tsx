import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Select as RadixSelect } from 'radix-ui'
import React from 'react'
import { cn } from '@/utils/cn'

export type SelectOption = {
	value: string
	label: React.ReactNode
	disabled?: boolean
}

interface SelectProps
	extends Omit<
		RadixSelect.SelectProps,
		'value' | 'defaultValue' | 'onValueChange' | 'children'
	> {
	options?: SelectOption[]
	value?: SelectOption['value']
	defaultValue?: SelectOption['value']
	placeholder?: React.ReactNode
	triggerClassName?: string
	contentClassName?: string
	onChange?: (value: SelectOption['value']) => void
}

export const Select: React.FC<SelectProps> = ({
	options = [],
	value,
	defaultValue,
	placeholder = '请选择',
	triggerClassName,
	contentClassName,
	onChange,
	...rootProps
}) => {
	return (
		<RadixSelect.Root
			value={value}
			defaultValue={defaultValue}
			onValueChange={onChange}
			{...rootProps}
		>
			<RadixSelect.Trigger
				className={cn(
					'inline-flex h-9 w-full min-w-40 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors',
					  'hover:bg-muted data-placeholder:text-muted-foreground',
					  'focus-visible:ring-2 focus-visible:ring-primary',
					'disabled:cursor-not-allowed disabled:opacity-50',
					triggerClassName
				)}
			>
				<RadixSelect.Value placeholder={placeholder} />
				<RadixSelect.Icon className="text-muted-foreground">
					<ChevronDownIcon className="size-4" />
				</RadixSelect.Icon>
			</RadixSelect.Trigger>

			<RadixSelect.Portal>
				<RadixSelect.Content
					position="popper"
					sideOffset={4}
					className={cn(
						'z-50 max-h-80 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
						contentClassName
					)}
				>
					<RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-popover text-muted-foreground">
						<ChevronUpIcon className="size-4" />
					</RadixSelect.ScrollUpButton>
					<RadixSelect.Viewport className="p-1">
						{options.map((option) => (
							<SelectItem
								key={option.value}
								value={option.value}
								disabled={option.disabled}
							>
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
				'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
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