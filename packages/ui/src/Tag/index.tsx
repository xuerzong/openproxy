import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const tagVariants = cva(
  'inline-block text-xs font-medium rounded-sm px-2 py-0.5',
  {
    variants: {
      color: {
        default: 'text-gray-900 bg-gray-900/10',
        gray: 'text-gray-900 bg-gray-200',
        slate: 'text-slate-900 bg-slate-200',
        blue: 'text-blue-900 bg-blue-200',
        cyan: 'text-cyan-900 bg-cyan-200',
        red: 'text-red-900 bg-red-200',
        orange: 'text-orange-900 bg-orange-200',
        yellow: 'text-yellow-800 bg-yellow-200',
        green: 'text-green-900 bg-green-200',
        emerald: 'text-emerald-900 bg-emerald-200',
        purple: 'text-purple-900 bg-purple-200',
        pink: 'text-pink-900 bg-pink-200',
      },
    },
  }
)

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
