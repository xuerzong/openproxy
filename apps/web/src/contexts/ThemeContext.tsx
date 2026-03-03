import { useSystemTheme } from '@/hooks/useSystemTheme'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

interface ThemeContextState {
  theme: Themes
  setTheme: (theme: Themes) => void
  displayTheme: 'light' | 'dark'
}

export const themes = ['light', 'dark', 'system'] as const

export type Themes = (typeof themes)[number]

export const ThemeContext = createContext<ThemeContextState | null>(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used in <ThemeProvider />')
  }
  return context
}

export const getDefaultTheme = () => {
  const cacheTheme = localStorage.getItem('aiproxy-theme')
  if (themes.includes(cacheTheme as any)) {
    return cacheTheme as Themes
  }
  return 'light' as Themes
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Themes>(getDefaultTheme())
  const systemTheme = useSystemTheme()

  const displayTheme = useMemo(() => {
    if (theme === 'system') {
      return systemTheme
    }
    return theme
  }, [systemTheme, theme])

  useEffect(() => {
    localStorage.setItem('aiproxy-theme', theme)
  }, [theme])

  useEffect(() => {
    if (displayTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [displayTheme])
  return (
    <ThemeContext value={{ theme, setTheme, displayTheme }}>
      {children}
    </ThemeContext>
  )
}
