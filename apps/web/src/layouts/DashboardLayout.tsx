import { Portal, Slot } from 'radix-ui'
import React, { useEffect } from 'react'
import { ChevronRightIcon } from 'lucide-react'
import { Outlet, useLocation } from 'react-router'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Logo } from '@/components/Logo'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { UserAccount } from '@/components/UserAccount'
import { TeamSwitcher } from '@/components/TeamSwitcher'
import { AnnouncementBanner } from '@/components/AnnouncementBanner'
import { useMenuTransition } from '@/hooks/useMenuTransition'
import { cn } from '@openproxy/ui/utils/cn'
import { changeCollapsed, toggleCollapsed, useAppStore } from '@/stores/app'

type MenuItemData = {
  type?: 'item'
  key: string
  icon?: React.ReactNode
  label: string
  access?: string
  onClick?: () => void
  matchPath?: (pathname: string) => boolean
  showArrow?: boolean
}

type MenuLabelData = {
  type: 'label'
  key: string
  label: string
}

type MenuSeparatorData = {
  type: 'separator'
  key: string
}

export type MenuData = MenuItemData | MenuLabelData | MenuSeparatorData

interface MenuItemProps {
  menu: MenuItemData
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
        <div className="absolute inset-0 rounded-md bg-muted ring-1 ring-border" />
      ) : null}
      <Slot.Root className="relative z-10 w-5 h-5">{menu.icon}</Slot.Root>
      <span className="relative z-10 flex-1">{menu.label}</span>
      {menu.showArrow ? (
        <ChevronRightIcon className="relative z-10 ml-auto h-4 w-4 text-muted-foreground" />
      ) : null}
    </div>
  )
}

interface MainLayoutProps {
  menus: MenuData[]
  showTeamSwitcher?: boolean
}

const MENU_TRANSITION_DURATION_MS = 200

export const DashboardLayout: React.FC<MainLayoutProps> = ({
  menus,
  showTeamSwitcher,
}) => {
  const collapsed = useAppStore((state) => state.collapsed)
  const pathname = useLocation().pathname
  const menuGroupKey = menus.map((menu) => menu.key).join('|')
  const {
    displayedItems: displayedMenus,
    transitionStage: menuTransitionStage,
  } = useMenuTransition(menus, menuGroupKey, {
    duration: MENU_TRANSITION_DURATION_MS,
  })

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
        {showTeamSwitcher && <TeamSwitcher />}
        <div className="relative flex flex-col gap-1 flex-1">
          <div
            className={cn(
              'flex flex-col gap-1 flex-1 transition-all duration-200 ease-out will-change-transform',
              {
                'translate-x-0 opacity-100': menuTransitionStage === 'idle',
                '-translate-x-5 opacity-0':
                  menuTransitionStage === 'exit-to-left',
                'translate-x-5 opacity-0':
                  menuTransitionStage === 'enter-from-right',
              }
            )}
          >
            {displayedMenus.map((menu) =>
              menu.type === 'separator' ? (
                <div key={menu.key} className="my-2 h-px bg-border" />
              ) : menu.type === 'label' ? (
                <div
                  key={menu.key}
                  className="px-4 pb-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/80"
                >
                  {menu.label}
                </div>
              ) : (
                <MenuItem
                  key={menu.key}
                  menu={menu}
                  isActive={
                    menu.matchPath
                      ? menu.matchPath(pathname)
                      : menu.key === pathname
                  }
                />
              )
            )}
          </div>
        </div>

        <div className="mt-auto"></div>
        <LanguageSwitcher />
        <ThemeSwitcher />
        <div className="h-px bg-border" />

        <div className="gap-2">
          <UserAccount />
        </div>
      </div>
      <div className="relative flex-1 min-w-0">
        <AnnouncementBanner />
        <Outlet />
      </div>
    </div>
  )
}
