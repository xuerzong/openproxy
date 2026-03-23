import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminTeamsCountQuery = ({ keyword }: { keyword?: string }) => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.adminTeamsCount, keyword],
    queryFn: () =>
      request.admin.teams.count
        .get({ query: { keyword } })
        .then((res) => res.data),
  })
}
