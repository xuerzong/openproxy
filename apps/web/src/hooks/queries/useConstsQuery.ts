import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useConstsQuery = () => {
  const request = useRequest()
  return useQuery({
    queryKey: ['consts'],
    queryFn: () => request.consts.get().then((res) => res.data),
  })
}
