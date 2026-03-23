import { useState } from 'react'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react'
import { Card } from './Card'
import { TeamForm } from './TeamForm'
import { DropdownMenu } from '@openproxy/ui/DropdownMenu'
import type { DropdownMenuItem } from '@openproxy/ui/DropdownMenu'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTeamsQuery } from '@/apps/tenant/hooks/queries/useTeamsQuery'
import { useTeamQuery } from '@/apps/tenant/hooks/queries/useTeamQuery'
import { useConstsQuery } from '@/hooks/queries/useConstsQuery'
import { useAuth } from '@/contexts/AuthContext'
import { changeActiveTeam } from '@/utils/better-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useIsOSS } from '@/hooks/useIsOSS'
import { queryKeys } from '@/constants/query-keys'
import { Avatar } from '@openproxy/ui/Avatar'
import { Skeleton } from '@openproxy/ui/Skeleton'

export const TeamSwitcher = () => {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshSession } = useAuth()
  const teamsQuery = useTeamsQuery()
  const teamQuery = useTeamQuery()
  const constsQuery = useConstsQuery()
  const [createOpen, setCreateOpen] = useState(false)

  const isLoading = teamsQuery.isLoading || teamQuery.isLoading

  const teams = teamsQuery.data || []
  const currentTeamId = teamQuery.data?.teamId
  const currentTeam = teams.find((t) => t.teamId === currentTeamId)
  const teamName = currentTeam?.team?.name || '...'
  const teamId = currentTeamId || ''

  const isOSS = useIsOSS()
  const maxTeams = constsQuery.data?.maxTeamsPerUser
  const canCreateTeam = isOSS || !maxTeams || teams.length < maxTeams

  const onSwitchTeam = async (nextTeamId: string) => {
    if (nextTeamId === currentTeamId) return
    await changeActiveTeam(nextTeamId)
    await refreshSession()
    await queryClient.invalidateQueries({ queryKey: [queryKeys.team] })
    await queryClient.invalidateQueries({ queryKey: [queryKeys.teams] })
    navigate('/', { replace: true })
  }

  const teamMenuItems: DropdownMenuItem[] = teams.map((t) => ({
    type: 'item' as const,
    key: t.teamId,
    label: (
      <span className="flex items-center gap-2">
        <Avatar
          src={t.team?.logo}
          className="w-5 h-5"
          iconClassName="w-3 h-3"
        />
        <span className="truncate">{t.team?.name || t.teamId}</span>
        {t.teamId === currentTeamId && (
          <CheckIcon className="w-4 h-4 ml-auto text-primary" />
        )}
      </span>
    ),
    onClick: () => onSwitchTeam(t.teamId),
  }))

  const menus: DropdownMenuItem[] = [
    ...teamMenuItems,
    { type: 'separator' },
    {
      type: 'item',
      key: 'settings',
      label: t('team.settings', { defaultValue: 'Team Settings' }),
      icon: <SettingsIcon />,
      onClick: () => {
        navigate('/settings/general')
      },
    },
    ...(canCreateTeam
      ? [
          { type: 'separator' as const },
          {
            type: 'item' as const,
            key: 'create',
            label: t('team.create', { defaultValue: 'Create Team' }),
            icon: <PlusIcon className="w-4 h-4" />,
            onClick: () => setCreateOpen(true),
          },
        ]
      : []),
  ]

  return (
    <>
      {isLoading ? (
        <Card className="flex items-center gap-2 p-4">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-4 w-24" />
        </Card>
      ) : (
        <DropdownMenu
          className="z-10"
          menus={menus}
          align="start"
          side="right"
          sideOffset={8}
        >
          <Card className="relative flex items-center gap-2 p-4 pr-8 select-none cursor-pointer hover:bg-muted">
            <Avatar src={currentTeam?.team?.logo} />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm w-full truncate">{teamName}</span>
            </div>
            <ChevronsUpDownIcon className="absolute top-[50%] right-4 translate-y-[-50%] w-4 h-4" />
          </Card>
        </DropdownMenu>
      )}
      <TeamForm open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
