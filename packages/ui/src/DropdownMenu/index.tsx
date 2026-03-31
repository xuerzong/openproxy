import { cn } from '../utils/cn'
import { DropdownMenu as RadixDropdownMenu, Slot } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useZIndexStore } from '../stores/zIndex'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { Drawer } from '../Drawer'
import { Button } from '../Button'

export type DropdownMenuItem =
  | {
      color?: 'default' | 'danger'
      disabled?: boolean
      icon?: React.ReactNode
      label: React.ReactNode
      key: string
      onClick: () => void
      type: 'item'
    }
  | { type: 'separator' }
export interface DropdownMenuProps
  extends RadixDropdownMenu.DropdownMenuContentProps {
  menus: DropdownMenuItem[]
}

export const DropdownMenu: React.FC<
  React.PropsWithChildren<DropdownMenuProps>
> = ({ children, menus, ...contentProps }) => {
  const nextZIndex = useZIndexStore((state) => state.next)
  const [open, setOpen] = useState(false)
  const [menuZIndex, setMenuZIndex] = useState(1000)
  const breakpoint = useBreakpoint()

  useEffect(() => {
    if (!open) return
    setMenuZIndex(nextZIndex())
  }, [open, nextZIndex])

  if (breakpoint.md) {
    return (
      <>
        <Slot.Root onClick={() => setOpen(!open)}>{children}</Slot.Root>
        <Drawer open={open} onOpenChange={setOpen}>
          {menus.map((menu, menuIndex) => {
            if (menu.type === 'separator') {
              return <hr key={menuIndex} className="border-t border-border" />
            }
            return (
              <Button
                key={menu.key}
                onClick={() => {
                  if (menu.disabled) {
                    return
                  }
                  menu.onClick()
                  setOpen(false)
                }}
                variant={menu.color === 'danger' ? 'danger' : 'ghost'}
                className="justify-start"
                disabled={menu.disabled}
              >
                {menu.icon && <Slot.Root>{menu.icon}</Slot.Root>}
                {menu.label}
              </Button>
            )
          })}
        </Drawer>
      </>
    )
  }

  return (
    <RadixDropdownMenu.Root open={open} onOpenChange={setOpen}>
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
                disabled={menu.disabled}
                onSelect={menu.onClick}
                className={cn(
                  'flex items-center gap-2 px-4 h-10 text-sm outline-none',
                  menu.disabled
                    ? 'text-foreground/50 cursor-not-allowed pointer-events-none'
                    : 'hover:bg-muted cursor-pointer'
                )}
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
