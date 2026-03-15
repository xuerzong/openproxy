import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Loader } from '@openproxy/ui/Loader'
import { useAuth } from '@/contexts/AuthContext'

const Page = () => {
  const [loading, setLoading] = useState(true)
  const { signOut } = useAuth()

  useEffect(() => {
    signOut().finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return <Navigate to="/auth/login" replace />
}

export default Page
