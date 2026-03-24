import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseAdminDashboardUsagesByModelGroupGroupedQueryParams {
  bucketHours?: number
  rangeHours?: number
}

export const useAdminDashboardUsagesByModelGroupGroupedQuery = ({
  bucketHours,
  rangeHours,
}: UseAdminDashboardUsagesByModelGroupGroupedQueryParams = {}) => {
  const request = useRequest()

  const bucketCount =
    bucketHours && rangeHours ? Math.floor(rangeHours / bucketHours) : undefined

  return useQuery({
    queryKey: [
      queryKeys.adminDashboardUsagesByModelGroupGrouped,
      bucketCount,
      rangeHours,
    ],
    queryFn: () =>
      request.admin.dashboard.usagesByModelGroupGrouped
        .get({
          query: {
            bucketCount,
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
