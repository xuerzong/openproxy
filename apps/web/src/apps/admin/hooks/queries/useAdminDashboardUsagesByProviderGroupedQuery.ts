import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseAdminDashboardUsagesByProviderGroupedQueryParams {
  bucketHours?: number
  rangeHours?: number
}

export const useAdminDashboardUsagesByProviderGroupedQuery = ({
  bucketHours,
  rangeHours,
}: UseAdminDashboardUsagesByProviderGroupedQueryParams = {}) => {
  const request = useRequest()

  const bucketCount =
    bucketHours && rangeHours ? Math.floor(rangeHours / bucketHours) : undefined

  return useQuery({
    queryKey: [
      queryKeys.adminDashboardUsagesByProviderGrouped,
      bucketCount,
      rangeHours,
    ],
    queryFn: () =>
      request.admin.dashboard.usagesByProviderGrouped
        .get({
          query: {
            bucketCount,
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
