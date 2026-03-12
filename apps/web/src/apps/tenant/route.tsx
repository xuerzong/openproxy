import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from 'react-router'
import { lazy } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const router = createBrowserRouter([
  {
    path: '/',
    Component: lazy(() => import('./layouts/DashboardLayout')),
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '',
        Component: lazy(() => import('./pages/Dashboard')),
      },
      {
        path: 'apiKeys',
        Component: lazy(() => import('./pages/APIKeys')),
      },
      {
        path: 'settings/',
        Component: lazy(() => import('./layouts/TeamSettingsLayout')),
        children: [
          {
            path: '',
            Component: lazy(() => import('./pages/TeamSettings')),
          },
          {
            path: 'general',
            Component: lazy(() => import('./pages/TeamSettings/General')),
          },
          {
            path: 'members',
            Component: lazy(() => import('./pages/TeamSettings/Members')),
          },
        ],
      },
      {
        path: 'account/settings/',
        Component: lazy(() => import('@/layouts/SettingsLayout')),
        children: [
          {
            path: '',
            Component: lazy(() => import('./pages/Settings')),
          },
          {
            path: 'general',
            Component: lazy(() => import('./pages/Settings/General')),
          },
        ],
      },
      {
        path: 'models',
        Component: lazy(() => import('./pages/Models')),
      },
      {
        path: 'orders',
        Component: lazy(() => import('./pages/Orders')),
      },
    ],
  },
  {
    path: '/join/:inviteCode',
    Component: lazy(() => import('./pages/JoinTeam')),
  },
  {
    path: '/auth/',
    Component: lazy(() => import('@/layouts/AuthLayout')),
    children: [
      {
        path: 'login',
        Component: lazy(() => import('@/pages/Login')),
      },
    ],
  },
  {
    path: '*',
    Component: lazy(() => import('@/pages/NotFound')),
  },
])

export default router

export const RouterProvider = () => {
  return <ReactRouterProvider router={router} />
}
