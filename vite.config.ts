import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// No GitHub Pages o app mora em /giro-a-giro/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/giro-a-giro/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        id: '/giro-a-giro/',
        name: 'Giro a Giro',
        short_name: 'Giro a Giro',
        description: 'Aprenda a montar o cubo mágico 3x3, um giro de cada vez.',
        lang: 'pt-BR',
        categories: ['education', 'games'],
        theme_color: '#DCEAFF',
        background_color: '#EEF4FF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
        globIgnores: ['**/index.esm-*.js'], // Firebase: só baixa quando a pessoa usa a conta
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: { cacheName: 'fontes', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
        }],
      },
    }),
  ],
});
