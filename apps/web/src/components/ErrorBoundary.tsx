import React from 'react'
import { useRouteError } from 'react-router'
import { NotFoundView } from '@/components/NotFoundView'

export class RouterError extends Error {
  code: number = 200
  constructor(message: string, code: number) {
    super(message)
    this.code = 200
  }
}

export const ErrorBoundary: React.FC<React.PropsWithChildren> = ({}) => {
  const error = useRouteError()
  if (error instanceof RouterError) {
    return <NotFoundView />
  }
  return <NotFoundView />
}
