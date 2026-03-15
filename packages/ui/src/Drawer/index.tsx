import { Drawer as VaulDrawer, type DialogProps, type ContentProps } from 'vaul'
import { useEffect, useState } from 'react'
import { CloseButton } from '../CloseButton'
import { cn } from '../utils/cn'
import { useZIndexStore } from '../stores/zIndex'

type DrawerProps = DialogProps & {
  contentProps?: ContentProps
}

export const Drawer: React.FC<React.PropsWithChildren<DrawerProps>> = ({
  children,
  contentProps,
  open,
  onOpenChange,
  defaultOpen,
  ...restProps
}) => {
  const nextZIndex = useZIndexStore((state) => state.next)
  const [innerOpen, setInnerOpen] = useState(Boolean(defaultOpen))
  const [drawerZIndex, setDrawerZIndex] = useState(1000)
  const isOpen = open ?? innerOpen

  useEffect(() => {
    if (!isOpen) return
    setDrawerZIndex(nextZIndex())
  }, [isOpen, nextZIndex])

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInnerOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <VaulDrawer.Root
      {...restProps}
      defaultOpen={defaultOpen}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay
          style={{ zIndex: drawerZIndex - 1 }}
          className="fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-md"
        />
        <VaulDrawer.Content
          {...contentProps}
          style={{ zIndex: drawerZIndex, ...contentProps?.style }}
          className={cn(
            'fixed bottom-0 left-[50%] translate-x-[-50%] p-6 bg-background border border-border rounded-t-lg min-w-xs w-full min-h-0 max-h-[90vh] shadow-xl',
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
