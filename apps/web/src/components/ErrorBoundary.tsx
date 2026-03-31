import React from 'react'
import { useRouteError } from 'react-router'
import { NotFoundView } from '@/components/NotFoundView'

export class RouterError extends Error {
  code: number = 200
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export const ErrorBoundary: React.FC = () => {
  const error = useRouteError()
  if (error instanceof RouterError) {
    return <NotFoundView />
  }
  return <NotFoundView />
}
