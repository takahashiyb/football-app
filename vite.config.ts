import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use '@/assets/styles/variables.scss' as v;
        @use '@/assets/styles/functions.scss' as f;
        @use '@/assets/styles/resets.scss' as reset;
        @use '@/assets/styles/properties.scss' as properties;
        `,
      },
    },
  },
})
