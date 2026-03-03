import { Loader } from '@/components/ui/Loader'
import { useState } from 'react'
import { Outlet } from 'react-router'

const AuthLayout: React.FC = () => {
  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <Outlet />
    </div>
  )
}

export default AuthLayout
