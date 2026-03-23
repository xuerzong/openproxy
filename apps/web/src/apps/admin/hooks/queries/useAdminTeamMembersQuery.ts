import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminTeamMembersQuery = ({ teamId }: { teamId?: string }) => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.adminTeamsMembers, teamId],
    enabled: Boolean(teamId),
    queryFn: () =>
      request.admin
        .teams({ id: teamId! })
        .members.get()
        .then((res) => res.data),
  })
}
