/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: () => '/v1/messages',
      },
      '/img-proxy': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Séparer les vendors stables en chunks cachables indépendamment du code app
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-dom/server'],
          'vendor-router': ['react-router-dom'],
          'vendor-dnd':    ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
    // Remonter le seuil d'alerte à 600 kB (les vendors sont désormais séparés)
    chunkSizeWarningLimit: 600,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/templates/**'],
    },
  },
});
