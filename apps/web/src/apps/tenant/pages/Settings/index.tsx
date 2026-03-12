import { useEffect } from 'react'
import { useNavigate } from 'react-router'

const Page = () => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/account/settings/general', { replace: true })
  }, [])
  return null
}

export default Page
