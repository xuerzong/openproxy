import { Tooltip as RadixTooltip } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useZIndexStore } from './stores/zIndex'

interface TooltipProps {
  content: React.ReactNode
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  children,
  content,
}) => {
  const nextZIndex = useZIndexStore((state) => state.next)
  const [open, setOpen] = useState(false)
  const [tooltipZIndex, setTooltipZIndex] = useState(1000)

  useEffect(() => {
    if (!open) return
    setTooltipZIndex(nextZIndex())
  }, [open, nextZIndex])

  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            style={{ zIndex: tooltipZIndex }}
            className="select-none rounded-md bg-foreground text-background py-2 px-3 text-sm leading-normal max-w-sm shadow-lg"
            sideOffset={5}
          >
            {content}
            <RadixTooltip.Arrow className="fill-foreground" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
