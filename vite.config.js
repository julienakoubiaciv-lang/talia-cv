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
        manualChunks(id) {
          // ── Vendors stables — chunksables indépendamment du code app ──
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'vendor-react';
          if (id.includes('node_modules/react-router'))
            return 'vendor-router';
          if (id.includes('node_modules/@dnd-kit'))
            return 'vendor-dnd';
          if (id.includes('node_modules/lucide-react'))
            return 'vendor-lucide';
          // Supabase complet dans son propre chunk cacheable
          // (évite de polluer index.js avec WebSocket / GoTrue / Realtime)
          if (id.includes('node_modules/@supabase'))
            return 'vendor-supabase';
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
    // Tests unitaires uniquement (sous src/). Les specs Playwright (e2e/) tournent
    // via `npm run test:e2e`, pas via vitest.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/templates/**'],
    },
  },
});
