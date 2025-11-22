import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5500,
    proxy: {
      // Proxy NHL API calls to NHL API (schedule, standings, gamecenter, player, etc.)
      '/api/schedule': {
        target: 'https://api-web.nhle.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/standings': {
        target: 'https://api-web.nhle.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/gamecenter': {
        target: 'https://api-web.nhle.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/api/player': {
        target: 'https://api-web.nhle.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy all other /api calls to Flask backend
      '/api': {
        target: 'http://localhost:5400',
        changeOrigin: true,
      },
    },
  },
})
