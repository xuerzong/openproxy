import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminTeamsCountQuery = ({ keyword }: { keyword?: string }) => {
  const request = useRequest()

  return useQuery({
    queryKey: ['admin/teams/count', keyword],
    queryFn: () =>
      request.admin.teams.count
        .get({ query: { keyword } })
        .then((res) => res.data),
  })
}
