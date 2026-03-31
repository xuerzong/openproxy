import { useEffect, useState } from 'react'
import { Loader } from '@openproxy/ui/Loader'
import { useTeamsQuery } from '@/apps/tenant/hooks/queries/useTeamsQuery'
import { NotFoundView } from '@/components/NotFoundView'

export const TeamLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const teamsQuery = useTeamsQuery()
  const teams = teamsQuery.data
  const isLoading = teamsQuery.isLoading

  useEffect(() => {
    if (!isLoading) {
      setLoading(false)
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
