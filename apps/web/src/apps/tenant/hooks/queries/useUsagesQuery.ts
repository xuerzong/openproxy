import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUsagesQuery = ({ page }: { page: number }) => {
  const limit = 50
  const offset = Math.max(page - 1, 0) * limit
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.usages, limit, offset],
    queryFn: () =>
      request.usages.get({ query: { limit, offset } }).then((res) => res.data),
  })
}
