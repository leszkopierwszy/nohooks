import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
        // Import produktu (Ollama) może trwać ~2 min
        timeout: 180000,
        proxyTimeout: 180000,
      },
      '/storage': {
        target: process.env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/model-assistant': {
        target: process.env.VITE_MODEL_ASSISTANT_PROXY || 'http://127.0.0.1:8190',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/model-assistant\/?/, '/') || '/',
      },
    },
  },
})
