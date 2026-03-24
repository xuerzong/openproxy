import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminOrdersCountQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.adminOrdersCount],
    queryFn: () => request.admin.orders.count.get().then((res) => res.data),
  })
}
