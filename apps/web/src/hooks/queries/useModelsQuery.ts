import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

interface UseModelsQueryParams {
  isPublic?: boolean
}

export const useModelsQuery = (params?: UseModelsQueryParams) => {
  const request = useRequest()
  return useQuery({
    queryKey: [queryKeys.listModels, `${params?.isPublic}`],
    queryFn: () =>
      request.listModels
        .get({ query: { isPublic: params?.isPublic } })
        .then((res) => res.data),
  })
}

export type UseModelsQueryOutput = Awaited<
  ReturnType<typeof useModelsQuery>
>['data']

export type Model = NonNullable<UseModelsQueryOutput>[number]
