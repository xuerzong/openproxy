import { Portal, Slot } from 'radix-ui'
import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Logo } from '@/components/Logo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { UserAccount } from '@/components/UserAccount'
import { cn } from '@/utils/cn'
import { changeCollapsed, toggleCollapsed, useAppStore } from '@/stores/app'

type MenuData = {
  key: string
  icon?: React.ReactNode
  label: string
  onClick?: () => void
}

interface MenuItemProps {
  menu: MenuData
  isActive?: boolean
}

const MenuItem: React.FC<MenuItemProps> = ({ menu, isActive = false }) => {
  return (
    <div
      key={menu.key}
      className={cn(
        'flex items-center gap-2 py-2  px-4 ring-1 ring-transparent rounded-md select-none cursor-pointer transition-colors z-10',
        { 'bg-muted text-foreground ring-border': isActive },
        { 'hover:bg-muted': !isActive }
      )}
      onClick={menu.onClick}
    >
      <Slot.Root className="w-5 h-5">{menu.icon}</Slot.Root>
      <span>{menu.label}</span>
    </div>
  )
}

interface MainLayoutProps {
  menus: MenuData[]
}

export const DashboardLayout: React.FC<MainLayoutProps> = ({ menus }) => {
  const collapsed = useAppStore((state) => state.collapsed)
  const pathname = useLocation().pathname

  useEffect(() => {
    changeCollapsed(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <Portal.Root className={cn('block md:hidden', { hidden: !collapsed })}>
        <div
          className="fixed z-50 left-0 top-0 bg-background/50 backdrop-blur-md w-screen h-screen"
          onClick={() => toggleCollapsed()}
        />
      </Portal.Root>
      <div
        className={cn(
          'fixed z-100 left-0 top-0 flex flex-col gap-4 w-64 shrink-0 border-r border-border p-4 h-screen bg-background transition-transform md:translate-x-0',
          'md:sticky md:z-50',
          { '-translate-x-full': !collapsed }
        )}
      >
        <div className="flex justify-start text-foreground">
          <Logo className="h-10 w-auto" />
        </div>
        {/* <TeamSwitcher /> */}
        <div className="flex flex-col gap-1 flex-1">
          {menus.map((menu) => (
            <MenuItem
              key={menu.key}
              menu={menu}
              isActive={menu.key === pathname}
            />
          ))}
        </div>

        <div className="mt-auto"></div>
        <ThemeSwitcher />
        <div className="h-px bg-border" />

        <div className="gap-2">
          {/* <MonthlyFreeQuota /> */}
          <UserAccount />
        </div>
      </div>
      <div className="relative flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
