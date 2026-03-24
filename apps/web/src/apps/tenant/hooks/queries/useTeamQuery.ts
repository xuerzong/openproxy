import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useTeamQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.team],
    queryFn: () => request.team.get().then((res) => res.data),
  })
}
