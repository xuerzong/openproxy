import NotFound from '@/pages/NotFound'
import React from 'react'
import { useRouteError, Outlet } from 'react-router'

export class RouterError extends Error {
  code: number = 200
  constructor(message: string, code: number) {
    super(message)
    this.code = 200
  }
}

export const ErrorBoundary: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const error = useRouteError()
  if (error instanceof RouterError) {
    return <NotFound />
  }
  return <NotFound />
}
