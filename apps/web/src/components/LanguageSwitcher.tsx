import { ChevronRightIcon, LanguagesIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@openproxy/ui/Button'
import { DropdownMenu, type DropdownMenuItem } from '@openproxy/ui/DropdownMenu'

const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const
const LANGUAGE_FLAGS = {
  'zh-CN': '🇨🇳',
  'en-US': '🇺🇸',
} as const

interface LanguageSwitcherProps {
  type?: 'default' | 'icon'
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  type = 'default',
}) => {
  const { t, i18n } = useTranslation('common')

  const activeLanguage = SUPPORTED_LANGUAGES.includes(
    i18n.resolvedLanguage as (typeof SUPPORTED_LANGUAGES)[number]
  )
    ? i18n.resolvedLanguage
    : i18n.language

  const menus: DropdownMenuItem[] = [
    {
      key: 'zh-CN',
      label: t('language.zhCN', { defaultValue: '简体中文' }),
      onClick() {
        i18n.changeLanguage('zh-CN')
      },
      icon: <span>{LANGUAGE_FLAGS['zh-CN']}</span>,
      type: 'item',
    },
    {
      key: 'en-US',
      label: t('language.enUS', { defaultValue: 'English' }),
      onClick() {
        i18n.changeLanguage('en-US')
      },
      icon: <span>{LANGUAGE_FLAGS['en-US']}</span>,
      type: 'item',
    },
  ]

  const currentLanguageLabel = menus.find(
    (menu): menu is Extract<DropdownMenuItem, { type: 'item' }> =>
      menu.type === 'item' && menu.key === activeLanguage
  )?.label

  return (
    <DropdownMenu
      align="end"
      side="right"
      sideOffset={8}
      className="z-101"
      menus={menus}
    >
      {type === 'icon' ? (
        <Button
          variant="outline"
          size="icon"
          aria-label={t('language.title', { defaultValue: 'Language' })}
          title={t('language.title', { defaultValue: 'Language' })}
        >
          <LanguagesIcon />
        </Button>
      ) : (
        <Button variant="outline" className="px-4 justify-between">
          <span className="flex items-center gap-2">
            <LanguagesIcon />
            <span>
              {t('language.title', { defaultValue: 'Language' })}
              {currentLanguageLabel ? ` (${currentLanguageLabel})` : ''}
            </span>
          </span>
          <ChevronRightIcon />
        </Button>
      )}
    </DropdownMenu>
  )
}
