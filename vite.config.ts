import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves project sites from /<repo>/; the deploy workflow sets VITE_BASE.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Cheness - Chess Opening Trainer',
        short_name: 'Cheness',
        description:
          'Play Stockfish in the browser with a live opening explorer: opening names, variations and popular continuations after every move.',
        theme_color: '#161512',
        background_color: '#161512',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including the Stockfish WASM, so the bot works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,json,woff2,txt}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // The explorer API is cached by the app itself (IndexedDB); the SW never touches it.
        runtimeCaching: [],
      },
    }),
  ],
  build: {
    // The embedded opening book (~630 KB raw, ~100 KB gzipped) lives in the main chunk.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
