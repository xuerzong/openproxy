import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const tagBaseClass = 'inline-block text-xs font-medium rounded-sm px-2 py-0.5'

const tagVariants = cva(tagBaseClass, {
  variants: {
    color: {
      default:
        'text-[var(--color-tag-default-foreground)] bg-[var(--color-tag-default-background)]',
      gray: 'text-[var(--color-tag-gray-foreground)] bg-[var(--color-tag-gray-background)]',
      slate:
        'text-[var(--color-tag-slate-foreground)] bg-[var(--color-tag-slate-background)]',
      blue: 'text-[var(--color-tag-blue-foreground)] bg-[var(--color-tag-blue-background)]',
      cyan: 'text-[var(--color-tag-cyan-foreground)] bg-[var(--color-tag-cyan-background)]',
      red: 'text-[var(--color-tag-red-foreground)] bg-[var(--color-tag-red-background)]',
      orange:
        'text-[var(--color-tag-orange-foreground)] bg-[var(--color-tag-orange-background)]',
      yellow:
        'text-[var(--color-tag-yellow-foreground)] bg-[var(--color-tag-yellow-background)]',
      green:
        'text-[var(--color-tag-green-foreground)] bg-[var(--color-tag-green-background)]',
      emerald:
        'text-[var(--color-tag-emerald-foreground)] bg-[var(--color-tag-emerald-background)]',
      purple:
        'text-[var(--color-tag-purple-foreground)] bg-[var(--color-tag-purple-background)]',
      pink: 'text-[var(--color-tag-pink-foreground)] bg-[var(--color-tag-pink-background)]',
    },
  },
})

export interface TagProps extends VariantProps<typeof tagVariants> {}

export const Tag: React.FC<React.PropsWithChildren<TagProps>> = ({
  color,
  children,
}) => {
  return (
    <div data-color={color} className={cn(tagVariants({ color }))}>
      {children}
    </div>
  )
}
