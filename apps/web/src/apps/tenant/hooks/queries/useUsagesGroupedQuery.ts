import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseUsagesGroupedQueryParams {
  bucketHours?: number
  rangeHours?: number
}

export const useUsagesGroupedQuery = ({
  bucketHours,
  rangeHours,
}: UseUsagesGroupedQueryParams = {}) => {
  const request = useRequest()

  const bucketCount =
    bucketHours && rangeHours ? Math.floor(rangeHours / bucketHours) : undefined

  return useQuery({
    queryKey: [queryKeys.usagesGrouped, bucketCount, rangeHours],
    queryFn: () =>
      request.usagesGrouped
        .get({
          query: {
            bucketCount,
            rangeHours,
          },
        })
        .then((res) => res.data),
  })
}
