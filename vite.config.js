import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset paths, so the build runs from any folder or static host
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
});
