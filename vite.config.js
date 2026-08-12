import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    proxy: {
      '/bing-api': {
        target: 'https://www.bing.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bing-api/, '')
      }
    }
  }
})
