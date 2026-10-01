/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_DEV_HOST?: string
  readonly VITE_DEV_PORT?: string
  readonly VITE_PREVIEW_HOST?: string
  readonly VITE_PREVIEW_PORT?: string
  readonly VITE_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
