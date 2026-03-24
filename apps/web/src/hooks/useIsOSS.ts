import { useConstsQuery } from '@/hooks/queries/useConstsQuery'

export const useIsOSS = () => {
  const { data } = useConstsQuery()
  return data?.isOSS ?? true
}
