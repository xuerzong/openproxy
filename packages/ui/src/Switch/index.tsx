import { Switch as RadixSwitch } from 'radix-ui'
import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const switchVariants = cva(
  'relative border border-border bg-muted rounded-full cursor-pointer transition-all duration-300 data-[state=checked]:bg-success/75 data-[state=checked]:border-success/75',
  {
    variants: {
      size: {
        sm: 'w-6 h-3',
        md: 'w-8 h-4',
        lg: 'w-10 h-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const thumbVariants = cva(
  'absolute top-[50%] left-0 translate-y-[-50%] flex items-center justify-center bg-background rounded-full shadow transition-all duration-300 data-[state=checked]:left-full data-[state=checked]:-translate-x-full data-[state=unchecked]:left-0 data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'w-2.5 h-2.5',
        md: 'w-3.5 h-3.5',
        lg: 'w-4.5 h-4.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

type SwitchProps = RadixSwitch.SwitchProps & VariantProps<typeof switchVariants>

export const Switch: React.FC<SwitchProps> = ({
  className,
  size,
  ...restProps
}) => {
  return (
    <RadixSwitch.Root
      className={cn(switchVariants({ size }), className)}
      {...restProps}
    >
      <RadixSwitch.Thumb className={thumbVariants({ size })} />
    </RadixSwitch.Root>
  )
}
