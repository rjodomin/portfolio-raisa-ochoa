import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Los perfiles del navegador contienen archivos bloqueados en Windows.
      ignored: ['**/.browser-check/**', '**/output/qa/**'],
    },
  },
})
