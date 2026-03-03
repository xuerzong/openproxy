interface LoadCt4Options {
  onLoad?: () => void
  onError?: (error: Error) => void
}

let isLoading = false
let isLoaded = false
let loadPromise: Promise<void> | null = null

export const loadCt4 = (options?: LoadCt4Options): Promise<void> => {
  if (isLoaded) {
    options?.onLoad?.()
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  isLoading = true

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.charset = 'utf-8'
    script.src = '/ct4.js'

    script.onload = () => {
      isLoaded = true
      isLoading = false
      options?.onLoad?.()
      resolve()
    }

    script.onerror = () => {
      isLoading = false
      loadPromise = null
      const error = new Error('Failed to load ct4.js')
      options?.onError?.(error)
      reject(error)
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

export const isCt4Loaded = (): boolean => isLoaded

export const isCt4Loading = (): boolean => isLoading
