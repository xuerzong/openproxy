import {
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  TvMinimalIcon,
} from 'lucide-react'
import { Button } from './ui/Button'
import { DropdownMenu, type DropdownMenuItem } from './ui/DropdownMenu'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation('common')

  const menus: DropdownMenuItem[] = [
    {
      key: 'dark',
      label: t('theme.dark', { defaultValue: 'Dark' }),
      onClick() {
        setTheme('dark')
      },
      icon: <MoonIcon />,
      type: 'item',
    },
    {
      key: 'light',
      label: t('theme.light', { defaultValue: 'Light' }),
      onClick() {
        setTheme('light')
      },
      icon: <SunIcon />,
      type: 'item',
    },

    {
      key: 'system',
      label: t('theme.system', { defaultValue: 'System' }),
      onClick() {
        setTheme('system')
      },
      icon: <TvMinimalIcon />,
      type: 'item',
    },
  ]

  const icon = menus.find(
    (menu): menu is Extract<DropdownMenuItem, { type: 'item' }> =>
      menu.type === 'item' && menu.key === theme
  )?.icon

  return (
    <DropdownMenu
      align="end"
      side="right"
      sideOffset={8}
      className="z-101"
      menus={menus}
    >
      <Button variant="outline" className="px-4 justify-between">
        <span className="flex items-center gap-2">
          {icon || <SunIcon />}
          <span>{t('theme.title', { defaultValue: 'Theme' })}</span>
        </span>
        <ChevronRightIcon />
      </Button>
    </DropdownMenu>
  )
}
