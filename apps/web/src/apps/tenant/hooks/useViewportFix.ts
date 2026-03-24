import { useEffect } from 'react'

export const useViewportFix = () => {
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight

      document.documentElement.style.setProperty('--true-vh', `${vh}px`)
    }

    window.visualViewport?.addEventListener('resize', updateHeight)
    updateHeight()

    return () =>
      window.visualViewport?.removeEventListener('resize', updateHeight)
  }, [])
}
