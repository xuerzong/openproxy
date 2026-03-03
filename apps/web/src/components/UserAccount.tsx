import { ChevronRight, LogOutIcon, SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { DropdownMenu } from './ui/DropdownMenu'
import { Card } from './Card'
import { useTranslation } from 'react-i18next'

export const UserAccount = () => {
  const { t } = useTranslation('common')
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  if (!session?.user) return null

  return (
    <DropdownMenu
      className="z-101"
      menus={[
        {
          type: 'item',
          key: 'settings',
          label: t('account.settings', { defaultValue: 'Account Settings' }),
          icon: <SettingsIcon />,
          onClick: () => {
            navigate('/settings')
          },
        },
        {
          type: 'item',
          key: 'logout',
          label: t('account.logout', { defaultValue: 'Sign Out' }),
          icon: <LogOutIcon className="w-4 h-4" />,
          onClick: () => {
            signOut()
          },
        },
      ]}
      align="end"
      side="right"
      sideOffset={8}
    >
      <Card className="relative flex items-center gap-2 p-4 pr-8 select-none cursor-pointer hover:bg-muted">
        <div className="shrink-0 w-8 h-8">
          <img
            className="w-8 h-8 rounded-full"
            src={`https://avatar.vercel.sh/${session?.user.id}`}
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm w-full truncate">{session.user.name}</span>
          <span className="text-xs font-bold uppercase">
            {t('common.free', { defaultValue: 'Free' })}
          </span>
        </div>
        <ChevronRight className="absolute top-[50%] right-4 translate-y-[-50%] w-4 h-4" />
      </Card>
    </DropdownMenu>
  )
}
