import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useOrderStatusQuery = ({ orderId }: { orderId: string }) => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.orderStatus, orderId],
    queryFn: () =>
      request.pay.status.get({ query: { orderId } }).then((res) => res.data),
    refetchInterval: 1000,
    enabled: Boolean(orderId),
  })
}
