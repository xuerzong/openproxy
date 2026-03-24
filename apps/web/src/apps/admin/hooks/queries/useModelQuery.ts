import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useModelQuery = (id: string) => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.model, id],
    queryFn: () =>
      request.models.get({ query: { id } }).then((res) => res.data),
    enabled: !!id,
  })
}

export type UseModelQueryOutput = Awaited<
  ReturnType<typeof useModelQuery>
>['data']
