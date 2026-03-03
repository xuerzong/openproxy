import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUsersQuery = ({ page }: { page: number }) => {
  const limit = 10
  const offset = Math.max(page - 1, 0) * 10
  const request = useRequest()
  return useQuery({
    queryKey: ['users', limit, offset],
    queryFn: () =>
      request.users.get({ query: { limit, offset } }).then((res) => res.data),
  })
}
