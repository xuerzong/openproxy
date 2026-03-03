import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAIProvidersQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: ['aiProviders'],
    queryFn: () => request.aiProviders.get().then((res) => res.data),
  })
}

export type UseAIProvidersQueryOutput = Awaited<
  ReturnType<typeof useAIProvidersQuery>
>['data']

export type AIProvider = NonNullable<UseAIProvidersQueryOutput>
