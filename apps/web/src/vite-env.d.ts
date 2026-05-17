/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET: string
}

interface Window {
  __APP_CONFIG__?: {
    UMAMI_WEBSITE_ID?: string
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
