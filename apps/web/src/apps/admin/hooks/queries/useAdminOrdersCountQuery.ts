import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminOrdersCountQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: ['admin/orders/count'],
    queryFn: () => request.admin.orders.count.get().then((res) => res.data),
  })
}
