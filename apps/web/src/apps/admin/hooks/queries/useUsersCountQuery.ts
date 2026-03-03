import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUsersCountQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: ['users/count'],
    queryFn: () => request.users.count.get().then((res) => res.data),
  })
}
