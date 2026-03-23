import { AuthRequiredRoute } from '@/components/AuthRequiredRoute'
import { DashboardLayout as DashboardLayoutRoot } from '@/layouts/DashboardLayout'
import {
  BoxIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  GaugeIcon,
  KeyRoundIcon,
  SettingsIcon,
  StampIcon,
  UsersIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { TeamLayout } from '@/layouts/TeamLayout'
import { useTranslation } from 'react-i18next'
import { useIsOSS } from '@/hooks/useIsOSS'

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('common')
  const isOSS = useIsOSS()
  const mainMenus = [
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

  const settingsMenus = useMemo(
    () => [
      {
        key: '/settings-back',
        icon: <ChevronLeftIcon className="w-5 h-5" />,
        label: t('teamSettings.backToWorkspace', {
          defaultValue: 'Back to Workspace',
        }),
        onClick() {
          navigate('/')
        },
        access: 'public',
      },
      {
        key: '/settings/general',
        icon: <SettingsIcon className="w-5 h-5" />,
        label: t('teamSettings.general.menu', {
          defaultValue: 'Basic Information',
        }),
        onClick() {
          navigate('/settings/general')
        },
        access: 'public',
      },
      {
        key: '/settings/members',
        icon: <UsersIcon className="w-5 h-5" />,
        label: t('teamSettings.members.menu', {
          defaultValue: 'User Management',
        }),
        onClick() {
          navigate('/settings/members')
        },
        access: 'public',
      },
      ...(!isOSS
        ? [
            {
              key: '/settings/billing',
              icon: <CreditCardIcon className="w-5 h-5" />,
              label: t('teamSettings.billing.menu', {
                defaultValue: 'Billing',
              }),
              onClick() {
                navigate('/settings/billing')
              },
              access: 'public' as const,
            },
          ]
        : []),
    ],
    [navigate, t, isOSS]
  )

  const menus = location.pathname.startsWith('/settings')
    ? settingsMenus
    : mainMenus

  return (
    <AuthRequiredRoute>
      <TeamLayout>
        <DashboardLayoutRoot menus={menus} showTeamSwitcher />
      </TeamLayout>
    </AuthRequiredRoute>
  )
}

export default DashboardLayout
