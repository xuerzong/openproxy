import { Drawer as VaulDrawer, type DialogProps, type ContentProps } from 'vaul'
import { CloseButton } from '../CloseButton'
import { cn } from '@/utils/cn'

type DrawerProps = DialogProps & {
  contentProps?: ContentProps
}

export const Drawer: React.FC<React.PropsWithChildren<DrawerProps>> = ({
  children,
  contentProps,
  ...restProps
}) => {
  return (
    <VaulDrawer.Root {...restProps}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-md z-1000" />
        <VaulDrawer.Content
          {...contentProps}
          className={cn(
            'fixed bottom-0 left-[50%] translate-x-[-50%] p-6 bg-background border border-border rounded-t-lg z-1000 min-w-md w-full min-h-0 max-h-[90vh] shadow-xl',
            'flex flex-col gap-4',
            contentProps?.className
          )}
        >
          <VaulDrawer.Handle className="shrink-0" />
          <VaulDrawer.Close className="absolute right-2 top-2" asChild>
            <CloseButton />
          </VaulDrawer.Close>
          <div>
            <VaulDrawer.Title></VaulDrawer.Title>
            <VaulDrawer.Description></VaulDrawer.Description>
          </div>
          <div className="flex-1 min-h-0 grid">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  )
}
