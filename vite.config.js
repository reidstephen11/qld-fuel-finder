import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api/qld': {
          target: 'https://www.data.qld.gov.au',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qld/, '/api/action'),
        },
        '/api/live': {
          target: 'https://fppdirectapi-prod.fuelpricesqld.com.au',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/live/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.VITE_FPQ_TOKEN) {
                proxyReq.setHeader('Authorization', `FPDAPI SubscriberToken=${env.VITE_FPQ_TOKEN}`)
              }
            })
          },
        },
      },
    },
  }
})
