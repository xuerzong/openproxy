import { Tooltip as RadixTooltip } from 'radix-ui'

interface TooltipProps {
  content: React.ReactNode
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  children,
  content,
}) => {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="select-none rounded-md bg-foreground text-background py-2 px-3 text-sm leading-normal max-w-sm shadow-lg z-9999"
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
