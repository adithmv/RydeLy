import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:5000',
      '/commuter': 'http://127.0.0.1:5000',
      '/driver': 'http://127.0.0.1:5000',
      '/admin': 'http://127.0.0.1:5000',
      '/ivr': 'http://127.0.0.1:5000',
    }
  }
})