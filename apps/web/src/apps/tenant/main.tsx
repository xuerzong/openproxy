import { AuthProvider } from '@/contexts/AuthContext'
import { ApiProvider } from '@/contexts/ApiContext'
import { ReactQueryProvider } from '@/contexts/ReactQueryContext'
import { RouterProvider } from './route'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'sonner'
import { useViewportFix } from '@/apps/tenant/hooks/useViewportFix'
import { useStatusBar } from '@/apps/tenant/hooks/useStatusBar'

export const TenantApp: React.FC = () => {
  useViewportFix()
  useStatusBar('#432dd7')
  return (
    <ThemeProvider>
      <AuthProvider>
        <ApiProvider>
          <ReactQueryProvider>
            <RouterProvider />
            <Toaster richColors position="bottom-right" />
          </ReactQueryProvider>
        </ApiProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
