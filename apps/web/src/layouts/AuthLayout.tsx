import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Loader } from '@/components/ui/Loader'
import { useState } from 'react'
import { Outlet } from 'react-router'

const AuthLayout: React.FC = () => {
  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="fixed top-4 right-4 z-20">
          <LanguageSwitcher type="icon" />
        </div>
        <Loader />
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="fixed top-4 right-4 z-20">
        <LanguageSwitcher type="icon" />
      </div>
      <Outlet />
    </div>
  )
}

export default AuthLayout
