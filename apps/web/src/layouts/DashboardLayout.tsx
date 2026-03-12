import { Portal, Slot } from 'radix-ui'
import React, { useEffect } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
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
  matchPath?: (pathname: string) => boolean
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
        'relative flex items-center gap-2 py-2 px-4 ring-1 ring-transparent rounded-md select-none cursor-pointer transition-colors z-10 overflow-hidden',
        { 'bg-muted text-foreground ring-border': isActive },
        { 'hover:bg-muted': !isActive }
      )}
      onClick={menu.onClick}
    >
      {isActive ? (
        <motion.div
          layoutId="dashboard-menu-active"
          className="absolute inset-0 rounded-md bg-muted ring-1 ring-border"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      ) : null}
      <Slot.Root className="relative z-10 w-5 h-5">{menu.icon}</Slot.Root>
      <span className="relative z-10">{menu.label}</span>
    </div>
  )
}

interface MainLayoutProps {
  menus: MenuData[]
}

export const DashboardLayout: React.FC<MainLayoutProps> = ({ menus }) => {
  const collapsed = useAppStore((state) => state.collapsed)
  const pathname = useLocation().pathname
  const menuGroupKey = menus.map((menu) => menu.key).join('|')

  useEffect(() => {
    changeCollapsed(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      <Portal.Root className={cn('block md:hidden', { hidden: !collapsed })}>
        <div
          className="fixed z-50 left-0 top-0 bg-black/50 backdrop-blur-md w-screen h-screen"
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
        <LayoutGroup>
          <div className="relative flex flex-col gap-1 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={menuGroupKey}
                className="flex flex-col gap-1 flex-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {menus.map((menu) => (
                  <MenuItem
                    key={menu.key}
                    menu={menu}
                    isActive={menu.matchPath ? menu.matchPath(pathname) : menu.key === pathname}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </LayoutGroup>

        <div className="mt-auto"></div>
        <LanguageSwitcher />
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
