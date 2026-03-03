/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET: string
  readonly VITE_SHOW_BILLING_ACTIONS?: string
  readonly VITE_SHOW_PHONE_LOGIN?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
