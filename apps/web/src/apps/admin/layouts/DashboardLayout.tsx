import { AdminRequiredRoute } from '@/components/AdminRequiredRoute'
import {
  DashboardLayout as DashboardLayoutRoot,
  type MenuData,
} from '@/layouts/DashboardLayout'
import {
  BoxIcon,
  GaugeIcon,
  MegaphoneIcon,
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
  const menus: MenuData[] = [
    {
      type: 'label',
      key: 'management-label',
      label: t('menu.management'),
    },
    {
      key: '/',
      icon: <GaugeIcon className="w-5 h-5" />,
      label: t('menu.dashboard'),
      onClick() {
        navigate('/')
      },
    },
    {
      key: '/orders',
      icon: <StampIcon className="w-5 h-5" />,
      label: t('menu.orders'),
      onClick() {
        navigate('/orders')
      },
    },
    {
      key: '/users',
      icon: <UsersIcon className="w-5 h-5" />,
      label: t('menu.users'),
      onClick() {
        navigate('/users')
      },
    },
    {
      key: '/teams',
      icon: <UsersRoundIcon className="w-5 h-5" />,
      label: t('menu.teams'),
      onClick() {
        navigate('/teams')
      },
    },
    {
      type: 'separator',
      key: 'resources-separator',
    },
    {
      type: 'label',
      key: 'resources-label',
      label: t('menu.resources'),
    },
    {
      key: '/models',
      icon: <BoxIcon className="w-5 h-5" />,
      label: t('menu.models'),
      onClick() {
        navigate('/models')
      },
    },
    {
      key: '/ai-providers',
      icon: <StoreIcon />,
      label: t('menu.aiProviders'),
      onClick() {
        navigate('/ai-providers')
      },
    },
    {
      type: 'separator',
      key: 'monitoring-separator',
    },
    {
      type: 'label',
      key: 'monitoring-label',
      label: t('menu.monitoring'),
    },
    {
      key: '/announcement',
      icon: <MegaphoneIcon className="w-5 h-5" />,
      label: t('menu.announcement'),
      onClick() {
        navigate('/announcement')
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
