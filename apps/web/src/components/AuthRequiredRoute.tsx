import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Loader } from './ui/Loader'

export const AuthRequiredRoute: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { session } = useAuth()
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

  return <>{children}</>
}
