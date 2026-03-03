import { AuthProvider } from '@/contexts/AuthContext'
import { ApiProvider } from '@/contexts/ApiContext'
import { ReactQueryProvider } from '@/contexts/ReactQueryContext'
import { RouterProvider } from './route'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'sonner'

export const AdminApp = () => {
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
