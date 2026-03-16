import type { ReactNode } from 'react'
import { toast } from 'sonner'

type ToastMessage<T> = ReactNode | ((value: T) => ReactNode)

interface ToastPromiseOptions<TValue> {
  loading: string
  success: ToastMessage<TValue>
  error: ToastMessage<unknown>
  onSuccess?: (value: TValue) => void
  onError?: (error: unknown) => void
}

interface ResponseErrorLike {
  status?: unknown
  value?: unknown
  message?: string
}

interface ResponseLike<TValue> {
  data: TValue
  error?: ResponseErrorLike | null
}

export class ToastRequestError extends Error {
  status?: unknown
  value?: unknown

  constructor(error?: ResponseErrorLike | null) {
    super(error?.message || 'Request failed')
    this.name = 'ToastRequestError'
    this.status = error?.status
    this.value = error?.value
  }
}

export const getToastRequestStatus = (error: unknown) => {
  return error instanceof ToastRequestError ? error.status : undefined
}

export const getToastRequestValue = (error: unknown) => {
  return error instanceof ToastRequestError ? error.value : undefined
}

export const toastPromise = <TValue>(
  promise: Promise<TValue>,
  options: ToastPromiseOptions<TValue>
) => {
  toast.promise(promise, {
    loading: options.loading,
    success: (value) => {
      options.onSuccess?.(value)
      return typeof options.success === 'function'
        ? options.success(value)
        : options.success
    },
    error: (error) => {
      options.onError?.(error)
      return typeof options.error === 'function'
        ? options.error(error)
        : options.error
    },
  })

  return promise
}

export const toastApiPromise = <TValue>(
  promise: Promise<ResponseLike<TValue>>,
  options: ToastPromiseOptions<TValue>
) => {
  const wrappedPromise = promise.then((response) => {
    if (response.error) {
      throw new ToastRequestError(response.error)
    }

    return response.data
  })

  return toastPromise(wrappedPromise, options)
}
