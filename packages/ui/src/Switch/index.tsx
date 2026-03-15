import { Switch as RadixSwitch } from 'radix-ui'
import { cn } from '../utils/cn'

export const Switch: React.FC<RadixSwitch.SwitchProps> = ({
  className,
  ...restProps
}) => {
  return (
    <RadixSwitch.Root
      className={cn(
        className,
        'Switch',
        'relative w-8 h-4 ring-1 ring-muted bg-muted rounded-full cursor-pointer transition-all duration-300',
        'data-[state=checked]:ring-success/75 data-[state=checked]:bg-success/75 data-[state=unchecked]:ring-muted'
      )}
      {...restProps}
    >
      <RadixSwitch.Thumb
        className={cn(
          'SwitchButton',
          'absolute top-[50%] left-0 translate-y-[-50%] flex items-center justify-center w-4 h-4 bg-background rounded-full shadow',
          'transition-all duration-300',
          'data-[state=checked]:left-full data-[state=checked]:-translate-x-full data-[state=unchecked]:left-0 data-[state=unchecked]:translate-x-0'
        )}
      />
    </RadixSwitch.Root>
  )
}
