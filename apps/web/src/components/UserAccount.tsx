import { ChevronRight, LogOutIcon, SettingsIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import { Card } from './Card'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@openproxy/ui/Avatar'
import { Skeleton } from '@openproxy/ui/Skeleton'

export const UserAccount = () => {
  const { t } = useTranslation('common')
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  if (typeof session === 'undefined') {
    return (
      <Card className="flex items-center gap-2 p-4">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
      </Card>
    )
  }
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
            navigate('/account/settings')
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
          <Avatar src={session?.user.image} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm w-full truncate">{session.user.name}</span>
        </div>
        <ChevronRight className="absolute top-[50%] right-4 translate-y-[-50%] w-4 h-4" />
      </Card>
    </DropdownMenu>
  )
}
