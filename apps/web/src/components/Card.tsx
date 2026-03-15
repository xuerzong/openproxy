import { cn } from '@openproxy/ui/utils/cn'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  className,
  children,
  ...restProps
}) => {
  return (
    <div
      className={cn('Card', 'p-6 border border-border rounded-lg', className)}
      {...restProps}
    >
      {children}
    </div>
  )
}
