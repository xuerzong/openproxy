import { cn } from '@/utils/cn'
import { DropdownMenu as RadixDropdownMenu, Slot } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useZIndexStore } from '@/stores/zIndex'

export type DropdownMenuItem =
  | {
      color?: 'default' | 'danger'
      icon?: React.ReactNode
      label: React.ReactNode
      key: string
      onClick: () => void
      type: 'item'
    }
  | { type: 'separator' }
interface DropdownMenuProps extends RadixDropdownMenu.DropdownMenuContentProps {
  menus: DropdownMenuItem[]
}

export const DropdownMenu: React.FC<
  React.PropsWithChildren<DropdownMenuProps>
> = ({ children, menus, ...contentProps }) => {
  const nextZIndex = useZIndexStore((state) => state.next)
  const [open, setOpen] = useState(false)
  const [menuZIndex, setMenuZIndex] = useState(1000)

  useEffect(() => {
    if (!open) return
    setMenuZIndex(nextZIndex())
  }, [open, nextZIndex])

  return (
    <RadixDropdownMenu.Root onOpenChange={setOpen}>
      <RadixDropdownMenu.Trigger asChild>{children}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          {...contentProps}
          style={{ zIndex: menuZIndex, ...contentProps.style }}
          className={cn(
            'min-w-48 bg-background border border-border rounded-lg overflow-hidden shadow-xl',
            contentProps.className
          )}
        >
          {menus.map((menu, menuIndex) =>
            menu.type === 'separator' ? (
              <RadixDropdownMenu.Separator
                key={menuIndex}
                className="border-b border-border"
              />
            ) : (
              <RadixDropdownMenu.Item
                key={menu.key}
                onClick={menu.onClick}
                className="flex items-center gap-2 px-4 h-10 text-sm hover:bg-muted outline-none cursor-pointer"
              >
                {menu.icon && (
                  <Slot.Root className="w-4 h-4">{menu.icon}</Slot.Root>
                )}
                <RadixDropdownMenu.Label>{menu.label}</RadixDropdownMenu.Label>
              </RadixDropdownMenu.Item>
            )
          )}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}
