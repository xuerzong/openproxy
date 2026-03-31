import {
  type DependencyList,
  type EffectCallback,
  useEffectEvent,
  useEffect,
  useRef,
} from 'react'

const useUpdateEffect = (effect: EffectCallback, deps?: DependencyList) => {
  const isMounted = useRef(false)
  const onUpdate = useEffectEvent(effect)

  useEffect(() => {
    if (isMounted.current) {
      const cleanup = onUpdate()
      return () => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup()
        }
      }
    } else {
      isMounted.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- custom hook forwards the caller's dependency list intentionally.
  }, deps)
}

export default useUpdateEffect
