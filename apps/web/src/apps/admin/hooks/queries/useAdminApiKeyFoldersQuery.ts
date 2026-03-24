import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminApiKeyFoldersQuery = ({ teamId }: { teamId: string }) => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.adminApiKeyFolders, teamId],
    queryFn: () =>
      request.admin.folders.get({ query: { teamId } }).then((res) => res.data),
    enabled: Boolean(teamId),
  })
}
