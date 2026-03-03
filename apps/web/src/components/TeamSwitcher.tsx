import {
  ChevronsUpDownIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react'
import { Card } from './Card'
import { DropdownMenu } from './ui/DropdownMenu'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

export const TeamSwitcher = () => {
  const { t } = useTranslation('common')
  const teamName = t('team.defaultName', { defaultValue: 'Hello' })
  const teamId = '123123'
  const navigate = useNavigate()
  return (
    <DropdownMenu
      className="z-10"
      menus={[
        {
          type: 'item',
          key: 'settings',
          label: t('team.settings', { defaultValue: 'Team Settings' }),
          icon: <SettingsIcon />,
          onClick: () => {
            navigate('/settings')
          },
        },
        { type: 'separator' },
        {
          type: 'item',
          key: 'logout',
          label: t('team.create', { defaultValue: 'Create Team' }),
          icon: <PlusIcon className="w-4 h-4" />,
          onClick: () => {
            // signOut()
          },
        },
      ]}
      align="start"
      side="right"
      sideOffset={8}
    >
      <Card className="relative flex items-center gap-2 p-4 pr-8 select-none cursor-pointer hover:bg-muted">
        <img
          className="w-8 h-8 rounded-full"
          src={`https://avatar.vercel.sh/${teamId}`}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm w-full truncate">{teamName}</span>
          <span className="text-xs font-medium uppercase">
            {t('team.plan', { defaultValue: 'Free - 2000000 users' })}
          </span>
        </div>
        <ChevronsUpDownIcon className="absolute top-[50%] right-4 translate-y-[-50%] w-4 h-4" />
      </Card>
    </DropdownMenu>
  )
}
