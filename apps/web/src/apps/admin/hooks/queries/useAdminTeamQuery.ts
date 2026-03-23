import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminTeamQuery = ({ teamId }: { teamId?: string }) => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.adminTeamsDetail, teamId],
    enabled: Boolean(teamId),
    queryFn: () =>
      request.admin
        .teams({ id: teamId! })
        .get()
        .then((res) => res.data),
  })
}
