import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Static SPA build. `base: './'` keeps every asset reference relative, which is
 * what a Capacitor wrap needs (capacitor://localhost on iOS, http://localhost
 * on Android) — see docs/WEB_ARCHITECTURE.md §7.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
  server: {
    port: 5173,
    host: true,
  },
});
