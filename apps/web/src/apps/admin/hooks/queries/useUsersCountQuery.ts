import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUsersCountQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.usersCount],
    queryFn: () => request.users.count.get().then((res) => res.data),
  })
}
