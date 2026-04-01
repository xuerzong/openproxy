import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAnnouncementQuery = () => {
  const request = useRequest()

  return useQuery({
    queryKey: [queryKeys.announcement],
    queryFn: () => request.announcement.get().then((res) => res.data),
  })
}
