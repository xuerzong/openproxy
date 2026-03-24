import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminOrdersQuery = ({ page }: { page: number }) => {
  const limit = 20
  const offset = Math.max(page - 1, 0) * limit
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.adminOrders, page],
    queryFn: () =>
      request.admin.orders
        .get({ query: { limit, offset } })
        .then((res) => res.data),
  })
}
