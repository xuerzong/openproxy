import React, { forwardRef, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader } from '../Loader'
import { cn } from '@/utils/cn'
import s from './index.module.scss'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap shrink-0 outline-none cursor-pointer select-none transition-colors duration-300',
    'disabled:bg-muted! disabled:text-foreground/75 disabled:cursor-not-allowed'
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground',
        ghost: 'hover:bg-muted hover:text-foreground',
        danger: 'bg-danger/10 hover:bg-danger/20 text-danger',
      },
      size: {
        default: 'h-10 gap-1.5 px-5',
        xs: 'h-6 gap-1 rounded-[min(var(--radius-md),6px)] px-3 text-xs',
        sm: 'h-8 gap-1 rounded-[min(var(--radius-md),8px)] px-4 text-[0.8rem]',
        lg: 'h-12 gap-1.5 px-4',
        icon: 'size-10',
        'icon-xs': 'size-6 rounded-[min(var(--radius-md),10px)]',
        'icon-sm': 'size-8 rounded-[min(var(--radius-md),12px)]',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  as?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      as,
      variant,
      size,
      className,
      loading,
      disabled,
      children,
      type = 'button',
      ...restProps
    },
    ref
  ) => {
    const $loading = useMemo(() => {
      return loading && !disabled
    }, [restProps])

    const Component: any = as || 'button'

    return (
      <Component
        ref={ref}
        {...restProps}
        className={cn(s.Button, buttonVariants({ variant, size, className }))}
        {...($loading && {
          'data-loading': $loading,
        })}
        data-size={size}
        data-variant={variant}
        disabled={disabled}
        type={type}
      >
        {children}
        {$loading && (
          <div className={s.LoadingWrapper}>
            <Loader />
          </div>
        )}
      </Component>
    )
  }
)
