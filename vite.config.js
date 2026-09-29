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
      },
    },
  },
  server: { host: true, port: 5173 },
});
