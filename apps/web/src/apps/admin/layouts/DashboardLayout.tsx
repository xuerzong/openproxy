import { AdminRequiredRoute } from '@/components/AdminRequiredRoute'
import { DashboardLayout as DashboardLayoutRoot } from '@/layouts/DashboardLayout'
import {
  BoxIcon,
  FolderIcon,
  GaugeIcon,
  StampIcon,
  StoreIcon,
  UsersRoundIcon,
  UsersIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
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
    },
    {
      key: '/orders',
      icon: <StampIcon className="w-5 h-5" />,
      label: t('menu.orders', { defaultValue: 'Orders' }),
      onClick() {
        navigate('/orders')
      },
    },
    {
      key: '/models',
      icon: <BoxIcon className="w-5 h-5" />,
      label: t('menu.models', { defaultValue: 'Models' }),
      onClick() {
        navigate('/models')
      },
    },
    {
      key: '/users',
      icon: <UsersIcon className="w-5 h-5" />,
      label: t('menu.users', { defaultValue: 'Users' }),
      onClick() {
        navigate('/users')
      },
    },
    {
      key: '/teams',
      icon: <UsersRoundIcon className="w-5 h-5" />,
      label: t('menu.teams', { defaultValue: 'Teams' }),
      onClick() {
        navigate('/teams')
      },
    },
    {
      key: '/ai-providers',
      icon: <StoreIcon />,
      label: t('menu.aiProviders', { defaultValue: 'AI Providers' }),
      onClick() {
        navigate('/ai-providers')
      },
    },
    {
      key: '/folders',
      icon: <FolderIcon className="w-5 h-5" />,
      label: t('menu.folders', { defaultValue: 'Folders' }),
      onClick() {
        navigate('/folders')
      },
    },
  ]
  return (
    <AdminRequiredRoute>
      <DashboardLayoutRoot menus={menus} />
    </AdminRequiredRoute>
  )
}

export default DashboardLayout
