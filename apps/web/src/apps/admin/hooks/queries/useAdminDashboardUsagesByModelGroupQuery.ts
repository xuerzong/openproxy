import { queryKeys } from '@/constants/query-keys'
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
    queryKey: [queryKeys.adminDashboardUsagesByModelGroup, rangeHours],
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
