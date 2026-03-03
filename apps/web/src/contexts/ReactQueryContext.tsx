import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

export const ReactQueryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const client = useMemo(() => new QueryClient(), [])
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
