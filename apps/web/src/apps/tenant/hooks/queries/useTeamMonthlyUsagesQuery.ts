import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useTeamMonthlyUsagesQuery = () => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.teamMonthlyUsages],
    queryFn: () =>
      request.team.usages.monthly.get().then((res) => {
        return (res.data || []).map((item) => ({
          ...item,
          monthStart: new Date(item.monthStart),
          monthEnd: new Date(item.monthEnd),
        }))
      }),
  })
}
