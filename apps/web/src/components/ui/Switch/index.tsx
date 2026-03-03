import { Switch as RadixSwitch } from 'radix-ui'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import s from './index.module.scss'

export const Switch: React.FC<RadixSwitch.SwitchProps> = ({
  className,
  ...restProps
}) => {
  return (
    <RadixSwitch.Root
      className={cn(
        className,
        s.Switch,
        'relative w-10 h-5 bg-muted rounded-full cursor-pointer transition-all duration-300'
      )}
      {...restProps}
    >
      <RadixSwitch.Thumb
        className={cn(
          s.SwitchButton,
          'absolute top-0 left-0 flex items-center justify-center w-5 h-5 bg-background rounded-full shadow',
          'transition-all duration-300'
        )}
      >
        <CheckIcon
          className={cn(
            s.SiwtchButtonCheckIcon,
            'inset-0 w-4 h-4 text-success'
          )}
        />
      </RadixSwitch.Thumb>
    </RadixSwitch.Root>
  )
}
