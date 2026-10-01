/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_APP_NAME?: string
  /** 本地开发时 /api 代理转发的后端地址，取值见 .env.development。 */
  readonly VITE_PROXY_TARGET?: string
  /** 本地开发服务器端口，取值见 .env.development。 */
  readonly VITE_DEV_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
