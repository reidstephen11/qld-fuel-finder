import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/qld-fuel-finder/',
  plugins: [react()],
  server: {
    host: true,
  },
})
