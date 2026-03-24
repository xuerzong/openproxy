import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useTeamsQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.teams],
    queryFn: () => request.auth.teams.get().then((res) => res.data),
  })
}
