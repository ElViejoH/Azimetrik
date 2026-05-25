import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy para evitar CORS en desarrollo
    proxy: {
      '/predict': 'http://localhost:8000',
      '/health':  'http://localhost:8000',
    }
  }
})
