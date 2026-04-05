import { authClient } from '@/utils/better-auth'
import { PhoneNumberRegExp } from '@/constants/regexp'
import type { Session, User } from 'better-auth'
import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextState {
  session: { session: Session; user: User } | null | undefined
  refreshSession: () => Promise<void>
  signIn: (account: string, password: string) => Promise<boolean>
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

  const querySession = async () => {
    await authClient.getSession().then((session) => {
      setSession(session.data)
    })
  }

  const isAdminUser = session ? (session.user as any).role === 'admin' : false

  useEffect(() => {
    querySession()
  }, [])

  const signIn = async (account: string, password: string) => {
    if (PhoneNumberRegExp.test(account)) {
      const response = await fetch('/api/auth/phone-password-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: account,
          password,
        }),
      })

      if (!response.ok) {
        return false
      }

      await querySession()
      return true
    }

    const result = await authClient.signIn.email({
      email: account,
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
