import { cn } from '@openproxy/ui/utils/cn'
import type { InputHTMLAttributes } from 'react'

interface LoginInputProps extends InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean
}

export const LoginInput: React.FC<LoginInputProps> = ({
  className,
  isError,
  ...restProps
}) => {
  return (
    <input
      className={cn(
        'w-full px-4 border border-border h-12 rounded-full outline-none transition-all duration-300',
        'ring-primary/20 hover:border-primary focus-visible:ring-2 focus-visible:border-primary',
        { 'border-danger! ring-danger/20!': isError },
        className
      )}
      {...restProps}
    />
  )
}
