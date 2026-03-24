import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useOrdersCountQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.ordersCount],
    queryFn: () => request.orders.count.get().then((res) => res.data),
  })
}
