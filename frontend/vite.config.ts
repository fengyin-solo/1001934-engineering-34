import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// 参数一律以仓库里提交的 .env.<mode> 为准（本地开发与部署两套参数冲突时，
// 仓库配置优先于 shell 环境变量与未提交的本地覆盖文件）：先剔掉 shell 里
// 同名的 VITE_* 变量，再只从仓库 env 文件读取，避免外部环境污染取数。
function loadRepoEnv(mode: string, root: string): Record<string, string> {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_')) {
      delete process.env[key]
    }
  }
  return loadEnv(mode, root, 'VITE_')
}

export default defineConfig(({ mode }) => {
  const env = loadRepoEnv(mode, process.cwd())

  // dev 与 preview 共用同一个后端代理目标，各自的监听地址/端口按模式取仓库配置
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:8000'
  const apiProxy = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: env.VITE_DEV_HOST ?? '127.0.0.1',
      port: Number(env.VITE_DEV_PORT ?? 5173),
      // 关掉自动打开页面：起服务时只打印地址，不拉起浏览器
      open: false,
      strictPort: false,
      proxy: apiProxy,
    },
    preview: {
      host: env.VITE_PREVIEW_HOST ?? '127.0.0.1',
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
      strictPort: true,
      proxy: apiProxy,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
