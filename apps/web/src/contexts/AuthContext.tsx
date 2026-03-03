import { authClient } from '@/utils/better-auth'
import type { Session, User } from 'better-auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextState {
  session: { session: Session; user: User } | null | undefined
  refreshSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextState | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('')
  }
  return context
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [session, setSession] = useState<AuthContextState['session']>(void 0)
  const isAdminUser = session ? (session.user as any).role === 'admin' : false
  useEffect(() => {
    querySession()
  }, [])

  const querySession = async () => {
    await authClient.getSession().then((session) => {
      setSession(session.data)
    })
  }

  const signIn = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
    })
    if (result.error) {
      return false
    }
    await querySession()
    return true
  }

  const signOut = async () => {
    const result = await authClient.signOut()
    await querySession()
    return Boolean(result.data?.success)
  }

  return (
    <AuthContext
      value={{
        session,
        refreshSession: querySession,
        signIn,
        signOut,
        isAdmin: isAdminUser,
      }}
    >
      {children}
    </AuthContext>
  )
}
