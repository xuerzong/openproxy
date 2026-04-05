import { treaty, type Treaty } from '@elysiajs/eden'
import type { Elysia } from 'elysia'
import { createContext, useContext, useMemo } from 'react'
import type { App } from '../../../server'
import { useAuth } from './AuthContext'

type AppRoutes = App extends {
  '~Routes': infer Routes extends Record<string, unknown>
}
  ? Routes
  : never

type EdenApp = Elysia<any, any, any, any, AppRoutes, any, any>

interface ApiContextState {
  api: Treaty.Create<EdenApp>
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
  useAuth()
  const api = useMemo(() => {
    return treaty<EdenApp>(getApiBaseUrl())
  }, [])
  return <ApiContext value={{ api }}>{children}</ApiContext>
}
