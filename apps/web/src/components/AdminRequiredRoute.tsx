import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Loader } from '@openproxy/ui/Loader'
import { NotFoundView } from '@/components/NotFoundView'

export const AdminRequiredRoute: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { session, isAdmin } = useAuth()

  if (typeof session === 'undefined') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isAdmin) {
    return <NotFoundView />
  }

  return <>{children}</>
}
