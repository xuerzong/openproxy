import { Dialog as RadixDialog, Slot } from 'radix-ui'
import { useEffect, useState } from 'react'
import { CloseButton } from '../CloseButton'
import { Button, type ButtonProps } from '../Button'
import { cn } from '../utils/cn'
import { useZIndexStore } from '../stores/zIndex'
import s from './index.module.scss'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Drawer } from '../Drawer'

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  footer?: React.ReactNode
  width?: string | number
  contentProps?: RadixDialog.DialogContentProps
  overlayProps?: RadixDialog.DialogOverlayProps
}

export const Dialog: React.FC<React.PropsWithChildren<DialogProps>> = ({
  open,
  onOpenChange,
  children,
  footer,
  title,
  description,
  width = 600,

  contentProps,
  overlayProps,
}) => {
  const nextZIndex = useZIndexStore((state) => state.next)
  const [dialogZIndex, setDialogZIndex] = useState<number>(1000)
  const breakpoint = useBreakpoint()

  useEffect(() => {
    if (!open) return
    setDialogZIndex(nextZIndex())
  }, [open, nextZIndex])

  if (breakpoint.md) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <div className="flex flex-col mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <p>{description}</p>
          </div>

          <div className="overflow-y-auto min-h-0 px-1 -mx-1">{children}</div>

          {footer && <div className="mt-4">{footer}</div>}
        </Drawer>
      </>
    )
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <Slot.Root className={s.DialogOverlay} {...overlayProps}>
          <RadixDialog.Overlay
            style={{ zIndex: dialogZIndex - 1 }}
            className={cn(
              s.DialogOverlay,
              'fixed inset-0 w-screen h-screen bg-black/50 backdrop-blur-md'
            )}
          />
        </Slot.Root>
        <Slot.Root {...contentProps}>
          <RadixDialog.Content
            style={{ width, zIndex: dialogZIndex }}
            className={cn(
              s.DialogContent,
              'flex flex-col p-6 bg-background ring-1 ring-foreground/10 rounded-lg max-w-[80vw] max-h-[90vh] min-h-0 shadow-xl'
            )}
          >
            <div className="flex flex-col mb-6">
              <RadixDialog.Title className="text-xl font-bold">
                {title}
              </RadixDialog.Title>
              <RadixDialog.Description>{description}</RadixDialog.Description>
            </div>

            <RadixDialog.Close className="absolute right-2 top-2" asChild>
              <CloseButton />
            </RadixDialog.Close>

            <div className="overflow-y-auto min-h-0 px-1 -mx-1">{children}</div>

            {footer && <div className="mt-4">{footer}</div>}
          </RadixDialog.Content>
        </Slot.Root>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

interface DialogFooterProps {
  okText?: string
  onOk?: () => Promise<void> | void
  okButtonProps?: ButtonProps
  cancelText?: string
  onCancel?: () => Promise<void> | void
  cancelButtonProps?: ButtonProps
  locale?: {
    cancelText?: React.ReactNode
    confirmText?: React.ReactNode
  }
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  okText,
  onOk,
  okButtonProps,
  onCancel,
  cancelText,
  cancelButtonProps,
  locale,
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button onClick={onCancel} variant="outline" {...cancelButtonProps}>
        {cancelText ?? locale?.cancelText ?? 'Cancel'}
      </Button>
      <Button onClick={onOk} {...okButtonProps}>
        {okText ?? locale?.confirmText ?? 'Confirm'}
      </Button>
    </div>
  )
}
