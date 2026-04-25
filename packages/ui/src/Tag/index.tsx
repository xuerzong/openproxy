import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const tagBaseClass = 'inline-block text-xs font-medium rounded-sm px-2 py-0.5'

const tagVariants = cva(tagBaseClass, {
  variants: {
    color: {
      default: 'text-tag-default-foreground bg-tag-default-background',
      gray: 'text-tag-gray-foreground bg-tag-gray-background',
      slate: 'text-tag-slate-foreground bg-tag-slate-background',
      blue: 'text-tag-blue-foreground bg-tag-blue-background',
      cyan: 'text-tag-cyan-foreground bg-tag-cyan-background',
      red: 'text-tag-red-foreground bg-tag-red-background',
      orange: 'text-tag-orange-foreground bg-tag-orange-background',
      yellow: 'text-tag-yellow-foreground bg-tag-yellow-background',
      green: 'text-tag-green-foreground bg-tag-green-background',
      emerald: 'text-tag-emerald-foreground bg-tag-emerald-background',
      purple: 'text-tag-purple-foreground bg-tag-purple-background',
      pink: 'text-tag-pink-foreground bg-tag-pink-background',
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
