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
        Component: lazy(() => import('@/apps/tenant/pages/APIKeys')),
      },
      {
        path: 'account/settings/',
        Component: lazy(() => import('@/layouts/SettingsLayout')),
        children: [
          {
            path: '',
            Component: lazy(() => import('@/apps/tenant/pages/Settings')),
          },
          {
            path: 'general',
            Component: lazy(
              () => import('@/apps/tenant/pages/Settings/General')
            ),
          },
        ],
      },
      {
        path: 'billing',
        Component: lazy(() => import('@/pages/Billing')),
      },
      {
        path: 'models',
        Component: lazy(() => import('./pages/Models')),
      },
      {
        path: 'models/new',
        Component: lazy(() => import('./pages/Models/Create')),
      },
      {
        path: 'models/*',
        Component: lazy(() => import('./pages/Models/Detail')),
      },
      {
        path: 'users',
        Component: lazy(() => import('./pages/Users')),
      },
      {
        path: 'teams',
        Component: lazy(() => import('./pages/Teams')),
      },
      {
        path: 'teams/:id',
        Component: lazy(() => import('./pages/Teams/Detail')),
      },
      {
        path: 'ai-providers',
        Component: lazy(() => import('./pages/AIProviders')),
      },
      {
        path: 'folders',
        Component: lazy(() => import('./pages/Folders')),
      },
      {
        path: 'orders',
        Component: lazy(() => import('./pages/Orders')),
      },
    ],
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
