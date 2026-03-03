import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react'

const useUpdateEffect = (effect: EffectCallback, deps?: DependencyList) => {
  const isMounted = useRef(false)

  useEffect(() => {
    if (isMounted.current) {
      const cleanup = effect()
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup()
        }
      }
    } else {
      isMounted.current = true
    }
  }, deps)
}

export default useUpdateEffect
