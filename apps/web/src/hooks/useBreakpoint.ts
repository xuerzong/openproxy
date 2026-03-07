import { useSize } from 'ahooks'

export const useBreakpoint = () => {
  const target = typeof document === 'undefined' ? null : document.body
  const size = useSize(target)

  const width =
    size?.width ?? (typeof window === 'undefined' ? 0 : window.innerWidth)

  return {
    sm: width < 768,
    md: width < 960,
    lg: width < 1028,
  }
}
