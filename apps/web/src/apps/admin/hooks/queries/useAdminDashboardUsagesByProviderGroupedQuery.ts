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
      'admin-dashboard-usages-by-provider-grouped',
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
