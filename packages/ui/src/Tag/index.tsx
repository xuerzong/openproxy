import { cn } from '../utils/cn'
import { cva, type VariantProps } from 'class-variance-authority'

const tagVariants = cva(
  'inline-block text-xs font-medium rounded-sm px-2 py-0.5',
  {
    variants: {
      color: {
        default: 'text-gray-900 bg-gray-900/10',
        gray: 'text-gray-900 bg-gray-200',
        yellow: 'text-yellow-800 bg-yellow-200',
        green: 'text-green-900 bg-green-200',
      },
    },
  }
)

interface TagProps extends VariantProps<typeof tagVariants> {}

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
