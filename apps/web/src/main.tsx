import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import './umami'

const target: string = import.meta.env.VITE_APP_TARGET

const renderApp = async () => {
  if (target === 'admin') {
    const { AdminApp } = await import('./apps/admin/main')
    createRoot(document.getElementById('root')!).render(<AdminApp />)
  } else {
    const { TenantApp } = await import('./apps/tenant/main')
    createRoot(document.getElementById('root')!).render(<TenantApp />)
  }
}

renderApp()
