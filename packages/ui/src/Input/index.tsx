import { mergeProps } from '../utils/props'
import React, { type InputHTMLAttributes, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../utils/cn'
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize'
import s from './index.module.scss'
import { Slot } from 'radix-ui'

export const inputVariants = cva(
  cn(
    'w-full h-10 px-4 text-sm border ring-2 ring-transparent outline-none rounded-md',
    'hover:ring-transparent focus-visible:border-primary focus-visible:ring-primary/20',
    'disabled:hover:border-border! disabled:bg-muted disabled:text-foreground/75',
    'transition-colors duration-300'
  ),
  {
    variants: {
      status: {
        default:
          'border-border hover:border-primary focus-visible:border-primary focus-visible:ring-primary/20',
        danger:
          'border-danger hover:border-danger focus-visible:border-danger focus-visible:ring-danger/20',
      },
    },
    defaultVariants: {
      status: 'default',
    },
  }
)

export interface InputProps
  extends
    InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  suffix?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    const mergedProps = useMemo(() => {
      const { suffix, status, ...restProps } = props
      const defaultProps = {
        className: cn(s.Input, inputVariants({ status })),
      }
      return mergeProps(defaultProps, restProps)
    }, [props])
    if (props.suffix) {
      return (
        <div className={s.InputWrapper}>
          <input ref={ref} {...mergedProps} />
          <div className={s.InputSuffix}>{props.suffix}</div>
        </div>
      )
    }
    return <input ref={ref} {...mergedProps} />
  }
)

interface TextareaProps extends TextareaAutosizeProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const mergedProps = useMemo(() => {
      return mergeProps(
        {
          className: cn(s.Input, s.Textarea, inputVariants()),
        },
        props
      )
    }, [props])
    return (
      <Slot.Root className="resize-none">
        <TextareaAutosize ref={ref} {...mergedProps} minRows={2} maxRows={8} />
      </Slot.Root>
    )
  }
)
