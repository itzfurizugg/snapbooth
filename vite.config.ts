import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { snapboothLocalApi } from './server/localApi.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicUrl = env.SNAPBOOTH_PUBLIC_URL || env.VITE_PUBLIC_URL || undefined

  return {
    plugins: [react(), snapboothLocalApi(publicUrl)],
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
