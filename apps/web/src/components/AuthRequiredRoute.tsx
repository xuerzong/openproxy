import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Loader } from '@openproxy/ui/Loader'

export const AuthRequiredRoute: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const location = useLocation()
  const { session } = useAuth()
  if (typeof session === 'undefined') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!session) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`
    )
    return <Navigate to={`/auth/login?redirect=${redirect}`} replace />
  }

  return <>{children}</>
}
