import { useRequest } from '@/contexts/ApiContext'
import { useQuery } from '@tanstack/react-query'

export const useAdminTeamsQuery = ({
  page,
  keyword,
}: {
  page: number
  keyword?: string
}) => {
  const limit = 20
  const offset = Math.max(page - 1, 0) * limit
  const request = useRequest()

  return useQuery({
    queryKey: ['admin/teams', page, keyword],
    queryFn: () =>
      request.admin.teams
        .get({ query: { limit, offset, keyword } })
        .then((res) => res.data),
  })
}
