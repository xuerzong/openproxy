import React, { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  loading?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  loading = true,
  ...props
}) => {
  if (!loading) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-foreground/8 dark:bg-foreground/10',
        className
      )}
      {...props}
    />
  )
}
