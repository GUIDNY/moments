import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths, so the build runs from any folder or static host
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // the game
        main: resolve(__dirname, 'index.html'),
        // the apartment walkthrough — a separate page that shares nothing with it
        apartment: resolve(__dirname, 'apartment.html'),
        // the agent product: a landing page that takes the photographs, a
        // builder that emits a shareable client tour, and the tour itself
        landing: resolve(__dirname, 'landing.html'),
        studio: resolve(__dirname, 'studio.html'),
        tour: resolve(__dirname, 'tour.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
});
