/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET: string
  readonly VITE_IS_OSS?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
