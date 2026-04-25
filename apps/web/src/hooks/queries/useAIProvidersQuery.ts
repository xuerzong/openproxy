import { queryKeys } from '@/constants/query-keys'
import { useRequest } from '@/contexts/ApiContext'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { AIProvider as RegistryAIProvider } from '@openproxy/config'

type AIProviderAPIKey = {
  id: string
  apiKey: string
  remark: string
  createdAt: Date
}

export type AIProviderItem = RegistryAIProvider & {
  apiKeys: AIProviderAPIKey[]
  apiKeyCount: number
}

export type AIProvider = AIProviderItem[]

export type UseAIProvidersQueryOutput = AIProvider

export const useAIProvidersQuery = (): UseQueryResult<AIProvider> => {
  const request = useRequest()
  return useQuery<AIProvider>({
    queryKey: [queryKeys.aiProviders],
    queryFn: () => request.aiProviders.get().then((res) => res.data ?? []),
  })
}
