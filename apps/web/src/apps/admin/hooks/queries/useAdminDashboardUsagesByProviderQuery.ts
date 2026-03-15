import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseAdminDashboardUsagesByProviderQueryParams {
  rangeHours?: number
}

export const useAdminDashboardUsagesByProviderQuery = ({
  rangeHours,
}: UseAdminDashboardUsagesByProviderQueryParams = {}) => {
  const request = useRequest()

  return useQuery({
    queryKey: ['admin-dashboard-usages-by-provider', rangeHours],
    queryFn: () =>
      request.admin.dashboard.usagesByProvider
        .get({
          query: {
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
