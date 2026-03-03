import { AuthRequiredRoute } from '@/components/AuthRequiredRoute'
import { DashboardLayout as DashboardLayoutRoot } from '@/layouts/DashboardLayout'
import { BoxIcon, GaugeIcon, KeyRoundIcon, StampIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { TeamLayout } from '@/layouts/TeamLayout'
import { useTranslation } from 'react-i18next'

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const menus = [
    {
      key: '/',
      icon: <GaugeIcon className="w-5 h-5" />,
      label: t('menu.dashboard', { defaultValue: 'Dashboard' }),
      onClick() {
        navigate('/')
      },
      access: 'public',
    },
    {
      key: '/apiKeys',
      icon: <KeyRoundIcon className="w-5 h-5" />,
      label: t('menu.apiKeys', { defaultValue: 'API Keys' }),
      onClick() {
        navigate('/apiKeys')
      },
      access: 'public',
    },
    {
      key: '/orders',
      icon: <StampIcon className="w-5 h-5" />,
      label: t('menu.orders', { defaultValue: 'Orders' }),
      onClick() {
        navigate('/orders')
      },
      access: 'public',
    },
    {
      key: '/models',
      icon: <BoxIcon className="w-5 h-5" />,
      label: t('menu.models', { defaultValue: 'Models' }),
      onClick() {
        navigate('/models')
      },
      access: 'public',
    },
  ]
  return (
    <AuthRequiredRoute>
      <TeamLayout>
        <DashboardLayoutRoot menus={menus} />
      </TeamLayout>
    </AuthRequiredRoute>
  )
}

export default DashboardLayout
