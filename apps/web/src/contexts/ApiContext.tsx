import { treaty, type Treaty } from '@elysiajs/eden'
import { createContext, useContext, useMemo } from 'react'
import type { App } from '../../../server'
import { useAuth } from './AuthContext'

interface ApiContextState {
  api: Treaty.Create<App>
}

const ApiContext = createContext<ApiContextState | null>(null)

export const useRequest = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useRequest must be used in <ApiProvider/>')
  }
  return context.api.api
}

const getApiBaseUrl = () => {
  return `${window.location.origin}`
}

export const ApiProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { session } = useAuth()
  const api = useMemo(() => {
    return treaty<App>(getApiBaseUrl())
  }, [session])
  return <ApiContext value={{ api }}>{children}</ApiContext>
}
