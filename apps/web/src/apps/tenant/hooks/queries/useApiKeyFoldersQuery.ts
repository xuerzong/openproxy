import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useApiKeyFoldersQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.apiKeyFolders],
    queryFn: () => request.apiKeyFolders.get().then((res) => res.data),
  })
}
