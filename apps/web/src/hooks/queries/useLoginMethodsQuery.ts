import { useQuery } from '@tanstack/react-query'

type LoginMethods = {
  github: boolean
  google: boolean
}

const fetchLoginMethods = (): Promise<LoginMethods> =>
  fetch('/api/auth/login-methods').then((res) => res.json())

export const useLoginMethodsQuery = () =>
  useQuery({
    queryKey: ['loginMethods'],
    queryFn: fetchLoginMethods,
  })
