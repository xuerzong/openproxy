import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useOrdersQuery = ({ page }: { page: number }) => {
  const limit = 20
  const offset = Math.max(page - 1, 0) * limit
  const request = useRequest()
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () =>
      request.orders.get({ query: { limit, offset } }).then((res) => res.data),
  })
}
