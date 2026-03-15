import { cn } from '@/utils/cn'
import { PageTitle } from './PageTitle'
import { PanelLeftIcon } from 'lucide-react'
import { Button } from '@openproxy/ui/Button'
import { toggleCollapsed } from '@/stores/app'

interface PageContainerProps {
  title?: string
  className?: string
}

export const PageContainer: React.FC<
  React.PropsWithChildren<PageContainerProps>
> = ({ children, title, className }) => {
  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      <div className="sticky top-0 bg-background z-100 border-b border-border">
        <div className="max-w-5xl w-full mx-auto flex items-center p-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => toggleCollapsed()}
          >
            <PanelLeftIcon className="w-5 h-5" />
          </Button>
          <PageTitle>{title}</PageTitle>
        </div>
      </div>
      <div className="max-w-5xl w-full mx-auto flex-1 min-h-0 flex flex-col gap-4 p-4">
        {children}
      </div>
    </div>
  )
}
