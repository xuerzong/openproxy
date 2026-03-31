import { cn } from '../utils/cn'
import { Tabs as RadixTabs, Slot } from 'radix-ui'

export interface TabItem {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
}

export interface TabsProps extends RadixTabs.TabsProps {
  items: TabItem[]
}

export const Tabs: React.FC<TabsProps> = ({ items, ...restProps }) => {
  return (
    <Slot.Root className="relative">
      <RadixTabs.Root {...restProps}>
        <RadixTabs.TabsList className="flex items-center gap-4">
          {items.map((item) => (
            <RadixTabs.Trigger
              className={cn(
                'h-10 flex items-center font-medium border-b-2 border-transparent transition-all duration-300 cursor-pointer',
                'data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-bold'
              )}
              key={item.key}
              value={item.key}
              asChild
            >
              <div className="flex items-center gap-1">
                {item.icon && (
                  <Slot.Root className="w-4 h-4 stroke-2">
                    {item.icon}
                  </Slot.Root>
                )}
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.TabsList>
        <div className="absolute bottom-px translate-y-1/2 w-full h-px bg-border -z-1"></div>
      </RadixTabs.Root>
    </Slot.Root>
  )
}
