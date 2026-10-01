import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The `/api` functions, mounted in the dev and preview servers.
 *
 * In production these are Vercel serverless functions. Vite knows nothing about
 * them, so without this the city has no prices anywhere except the deployed
 * site — which means the only way to try a change is to ship it. Same handler
 * files, same request shape, so what works here works there.
 */
function apiRoutes() {
  const mount = async (req, res, next) => {
    const match = /^\/api\/([a-z0-9-]+)/i.exec(req.url || '');
    if (!match) return next();
    try {
      const mod = await import(`./api/${match[1]}.js`);
      const url = new URL(req.url, 'http://localhost');
      req.query = Object.fromEntries(url.searchParams);
      const json = (body) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };
      res.status = (code) => {
        res.statusCode = code;
        return { json, end: () => res.end() };
      };
      res.json = json;
      await mod.default(req, res);
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'dev-proxy', detail: String(err.message || err) }));
    }
  };
  /* Block bodies on purpose: an arrow that *returns* `middlewares.use(...)`
     hands Vite the connect app, and Vite treats a returned value from these
     hooks as a post-hook to call — with no arguments, so the first thing it
     touches is `req.url` on undefined and the server never starts. */
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(mount);
    },
    configurePreviewServer(server) {
      server.middlewares.use(mount);
    },
  };
}

export default defineConfig({
  // relative asset paths, so the build runs from any folder or static host
  base: './',
  plugins: [react(), apiRoutes()],
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
