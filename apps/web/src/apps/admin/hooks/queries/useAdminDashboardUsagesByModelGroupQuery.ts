import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseAdminDashboardUsagesByModelGroupQueryParams {
  rangeHours?: number
}

export const useAdminDashboardUsagesByModelGroupQuery = ({
  rangeHours,
}: UseAdminDashboardUsagesByModelGroupQueryParams = {}) => {
  const request = useRequest()

  return useQuery({
    queryKey: ['admin-dashboard-usages-by-model-group', rangeHours],
    queryFn: () =>
      request.admin.dashboard.usagesByModelGroup
        .get({
          query: {
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
