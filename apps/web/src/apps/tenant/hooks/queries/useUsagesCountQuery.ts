import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUsagesTotalQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.usagesTotal],
    queryFn: () => request.usagesTotal.get().then((res) => res.data),
  })
}
