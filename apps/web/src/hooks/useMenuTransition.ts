import { useEffect, useRef, useState } from 'react'

export type MenuTransitionStage = 'idle' | 'enter-from-right' | 'exit-to-left'

interface UseMenuTransitionOptions {
  duration?: number
}

export const useMenuTransition = <T>(
  items: T[],
  groupKey: string,
  options?: UseMenuTransitionOptions
) => {
  const duration = options?.duration ?? 200
  const [displayedItems, setDisplayedItems] = useState(items)
  const [displayedGroupKey, setDisplayedGroupKey] = useState(groupKey)
  const [transitionStage, setTransitionStage] =
    useState<MenuTransitionStage>('idle')
  const transitionTimeoutRef = useRef<number | null>(null)
  const transitionFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
      if (transitionFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (groupKey === displayedGroupKey) {
      setDisplayedItems(items)
      return
    }

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current)
    }
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current)
    }

    setTransitionStage('exit-to-left')

    transitionTimeoutRef.current = window.setTimeout(() => {
      transitionTimeoutRef.current = null
      setDisplayedItems(items)
      setDisplayedGroupKey(groupKey)
      setTransitionStage('enter-from-right')

      transitionFrameRef.current = window.requestAnimationFrame(() => {
        transitionFrameRef.current = window.requestAnimationFrame(() => {
          transitionFrameRef.current = null
          setTransitionStage('idle')
        })
      })
    }, duration)
  }, [displayedGroupKey, duration, groupKey, items])

  return {
    displayedItems,
    transitionStage,
  }
}
