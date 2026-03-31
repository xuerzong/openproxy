import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAccessTokensQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.accessTokens],
    queryFn: () => request.accessTokens.get().then((res) => res.data),
  })
}
