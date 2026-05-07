import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins : [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'nadhif.yanlouggani.dev',
      '.yanlouggani.dev'  // Autorise tous les sous-domaines
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // ... reste de votre config
})

