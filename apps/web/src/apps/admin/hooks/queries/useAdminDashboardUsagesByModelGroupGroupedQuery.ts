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
      'admin-dashboard-usages-by-model-group-grouped',
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
