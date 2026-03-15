import { useEffect, useState } from 'react'
import { Loader } from '@openproxy/ui/Loader'
import { useTeamsQuery } from '@/apps/tenant/hooks/queries/useTeamsQuery'
import { NotFoundView } from '@/components/NotFoundView'
import { authClient } from '@/utils/better-auth'

export const TeamLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const teamsQuery = useTeamsQuery()
  const teams = teamsQuery.data
  const isLoading = teamsQuery.isLoading

  useEffect(() => {
    if (!isLoading) {
      setLoading(false)
      // authClient.sess
      const { protocol, host, pathname, search } = window.location
      // const subDomain = host.split('.').slice(0, -2).join('')
      // const team =
      //   teams?.find((team) => team.teamId === subDomain) || teams?.[0]

      // const nextTeamId = team?.teamId || 'app'

      // if (subDomain !== nextTeamId) {
      //   const nextHost = [nextTeamId, ...host.split('.').slice(-2)].join('.')
      //   const redirectUrl = `${protocol}//${nextHost}${pathname}${search}`
      //   window.location.replace(redirectUrl)
      // }
    }
  }, [isLoading, teams])

  if (isLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return <NotFoundView />
  }

  return children
}
