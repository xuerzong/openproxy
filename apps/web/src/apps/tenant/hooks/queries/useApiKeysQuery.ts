import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useApiKeysQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.apiKeys],
    queryFn: () => request.apiKeys.get().then((res) => res.data),
  })
}
