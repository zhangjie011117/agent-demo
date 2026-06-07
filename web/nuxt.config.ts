import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@nuxt/ui'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      proxy: 'http://localhost:3001/**',
    },
  },

  vite: {
    build: {
      sourcemap: false,
    },
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
})
