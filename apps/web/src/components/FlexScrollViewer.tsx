import { cn } from '@openproxy/ui/utils/cn'

interface FlexScrollViewerProps {
  bordered?: boolean
  className?: string
}

export const FlexScrollViewer: React.FC<
  React.PropsWithChildren<FlexScrollViewerProps>
> = ({ className, bordered, children }) => {
  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-y-auto',
        {
          'border border-border rounded-md': bordered,
        },
        className
      )}
    >
      {children}
    </div>
  )
}
