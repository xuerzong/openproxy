import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useTeamMembersQuery = () => {
  const request = useRequest()

  return useQuery({
    queryKey: ['team-members'],
    queryFn: () => request.team.members.get().then((res) => res.data),
  })
}