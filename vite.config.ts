import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { snapboothLocalApi } from './server/localApi.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [react(), snapboothLocalApi()],
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  }
})
