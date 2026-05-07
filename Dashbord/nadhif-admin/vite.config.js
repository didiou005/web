// vite.config.js (à la racine du projet frontend)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    allowedHosts: [
      'nadhif.yanlouggani.dev',
      '.yanlouggani.dev'
    ],
    hmr: false,
    open: true,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin\/api/, '/api'),
      }
    }
  },
  base: '/admin/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    }
  }
});
