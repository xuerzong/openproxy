import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  envDir: './envs',
  envPrefix: 'VITE_',
  plugins: [react(), viteCompression(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        manualChunks: (id) => {
          if (id.includes('/node_modules/recharts/')) {
            return 'recharts'
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/')
          ) {
            return 'react-vendor'
          }

          return undefined
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/': {
        target: 'http://localhost:3888/api/',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    allowedHosts: ['.aiproxy.shop'],
  },
})
