import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// env 文件的极简解析：只支持 key=value、# 注释与可选引号，够覆盖本仓库的 .env.*。
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const equals = line.indexOf('=')
    if (equals === -1) {
      continue
    }
    const key = line.slice(0, equals).trim()
    let value = line.slice(equals + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

// 端口、代理目标等参数统一从仓库里的 env 文件取数，dev / build / 类型检查各环节口径一致。
// 只读取仓库文件，不合并 process.env：本地开发与部署两套参数冲突（例如 shell 里残留了
// 别的 VITE_PROXY_TARGET）时，一律按仓库配置取数。
// 优先级：.env.<mode>.local > .env.<mode> > .env；*.local 不入库，只作个人临时覆盖。
function readRepoEnv(mode: string, envDir: string): Record<string, string> {
  const fileNames = ['.env', `.env.${mode}`, `.env.${mode}.local`]
  const result: Record<string, string> = {}
  for (const fileName of fileNames) {
    const fullPath = join(envDir, fileName)
    if (existsSync(fullPath)) {
      Object.assign(result, parseEnvFile(readFileSync(fullPath, 'utf-8')))
    }
  }
  return result
}

export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('.', import.meta.url))
  const env = readRepoEnv(mode, envDir)
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'
  const port = Number(env.VITE_DEV_PORT || 5173)

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '127.0.0.1',
      port,
      // 关掉自动打开页面：起服务时只打印地址，不拉起浏览器
      open: false,
      strictPort: false,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
