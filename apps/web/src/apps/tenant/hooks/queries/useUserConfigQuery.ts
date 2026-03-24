import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useUserConfigQuery = () => {
  const request = useRequest()
  const query = useQuery({
    queryKey: [queryKeys.userConfig],
    queryFn: () => request.userConfig.get().then((res) => res.data),
  })
  return query
}
