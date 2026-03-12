import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { CheckCircle2Icon, TriangleAlertIcon, UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthRequiredRoute } from '@/components/AuthRequiredRoute'
import { Card } from '@/components/Card'
import { Button } from '@/components/ui/Button'
import { useRequest } from '@/contexts/ApiContext'
import { useAuth } from '@/contexts/AuthContext'
import { changeActiveTeam } from '@/utils/better-auth'

type JoinState =
  | 'loading'
  | 'success'
  | 'already-member'
  | 'full'
  | 'not-found'
  | 'forbidden'
  | 'error'

const JoinTeamPageInner = () => {
  const { t } = useTranslation('common')
  const request = useRequest()
  const { refreshSession } = useAuth()
  const navigate = useNavigate()
  const { inviteCode = '' } = useParams()
  const [state, setState] = useState<JoinState>('loading')
  const [team, setTeam] = useState<any>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    let alive = true

    const joinTeam = async () => {
      setState('loading')
      const response = await request.team.join.post({ inviteCode })

      if (!alive) {
        return
      }

      if (response.error) {
        const status = Number(response.error.status)

        if (status === 409) {
          setState('full')
          return
        }

        if (status === 404) {
          setState('not-found')
          return
        }

        if (status === 403) {
          setState('forbidden')
          return
        }

        setState('error')
        return
      }

      if (typeof response.data === 'string') {
        setState('error')
        return
      }

      setTeam(response.data.team)
      setState(response.data.alreadyMember ? 'already-member' : 'success')
    }

    joinTeam()

    return () => {
      alive = false
    }
  }, [inviteCode, request.team.join])

  const onSwitchTeam = async () => {
    if (!team?.id || switching) {
      return
    }

    setSwitching(true)
    await changeActiveTeam(team.id)
    await refreshSession()
    setSwitching(false)
    toast.success(
      t('teamSettings.join.switchSuccess', {
        defaultValue: 'Switched to the invited team',
      })
    )
    navigate('/', { replace: true })
  }

  const stateContent: Record<
    JoinState,
    { title: string; description: string; icon: ReactNode }
  > = {
    loading: {
      title: t('teamSettings.join.loadingTitle', { defaultValue: 'Joining team...' }),
      description: t('teamSettings.join.loadingDescription', {
        defaultValue: 'Please wait while we verify the invitation.',
      }),
      icon: <UsersIcon className="w-10 h-10" />,
    },
    success: {
      title: t('teamSettings.join.successTitle', { defaultValue: 'Invitation accepted' }),
      description: t('teamSettings.join.successDescription', {
        defaultValue: 'You have joined the invited team successfully.',
      }),
      icon: <CheckCircle2Icon className="w-10 h-10 text-success" />,
    },
    'already-member': {
      title: t('teamSettings.join.alreadyMemberTitle', {
        defaultValue: 'Already in this team',
      }),
      description: t('teamSettings.join.alreadyMemberDescription', {
        defaultValue: 'Your account is already a member of the invited team.',
      }),
      icon: <CheckCircle2Icon className="w-10 h-10 text-success" />,
    },
    full: {
      title: t('teamSettings.join.fullTitle', { defaultValue: 'No seats available' }),
      description: t('teamSettings.join.fullDescription', {
        defaultValue:
          'The team has reached its member limit. Please contact the team owner to free up a seat.',
      }),
      icon: <TriangleAlertIcon className="w-10 h-10 text-yellow-500" />,
    },
    'not-found': {
      title: t('teamSettings.join.notFoundTitle', {
        defaultValue: 'Invitation not found',
      }),
      description: t('teamSettings.join.notFoundDescription', {
        defaultValue: 'This invitation link is invalid or has expired.',
      }),
      icon: <TriangleAlertIcon className="w-10 h-10 text-danger" />,
    },
    forbidden: {
      title: t('teamSettings.join.forbiddenTitle', {
        defaultValue: 'Unable to join team',
      }),
      description: t('teamSettings.join.forbiddenDescription', {
        defaultValue: 'This team is currently unavailable.',
      }),
      icon: <TriangleAlertIcon className="w-10 h-10 text-danger" />,
    },
    error: {
      title: t('teamSettings.join.errorTitle', { defaultValue: 'Join failed' }),
      description: t('teamSettings.join.errorDescription', {
        defaultValue: 'We could not process this invitation right now.',
      }),
      icon: <TriangleAlertIcon className="w-10 h-10 text-danger" />,
    },
  }

  const content = stateContent[state]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          {content.icon}
          <div>
            <div className="text-2xl font-semibold">{content.title}</div>
            <div className="text-sm text-secondary mt-2">{content.description}</div>
          </div>
          {team?.name ? <div className="text-sm font-medium">{team.name}</div> : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {(state === 'success' || state === 'already-member') && (
            <Button loading={switching} onClick={onSwitchTeam}>
              {t('teamSettings.join.switchTeam', {
                defaultValue: 'Switch to this team',
              })}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/', { replace: true })}>
            {t('teamSettings.join.backHome', { defaultValue: 'Back to dashboard' })}
          </Button>
        </div>
      </Card>
    </div>
  )
}

const Page = () => {
  return (
    <AuthRequiredRoute>
      <JoinTeamPageInner />
    </AuthRequiredRoute>
  )
}

export default Page