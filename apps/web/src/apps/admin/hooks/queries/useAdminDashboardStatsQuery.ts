import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminDashboardStatsQuery = () => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.adminDashboardStats],
    queryFn: () => request.admin.dashboard.stats.get().then((res) => res.data),
  })
}
