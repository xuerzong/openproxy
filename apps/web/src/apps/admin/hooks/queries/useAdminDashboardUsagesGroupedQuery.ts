import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseAdminDashboardUsagesGroupedQueryParams {
  bucketHours?: number
  rangeHours?: number
}

export const useAdminDashboardUsagesGroupedQuery = ({
  bucketHours,
  rangeHours,
}: UseAdminDashboardUsagesGroupedQueryParams = {}) => {
  const request = useRequest()

  const bucketCount =
    bucketHours && rangeHours ? Math.floor(rangeHours / bucketHours) : undefined

  return useQuery({
    queryKey: ['admin-dashboard-usages-grouped', bucketCount, rangeHours],
    queryFn: () =>
      request.admin.dashboard.usagesGrouped
        .get({
          query: {
            bucketCount,
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
