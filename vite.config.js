import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { localStockingsPlugin } from './scripts/vite-local-stockings.js';

// GitHub project Pages asset prefix (repo name).
const PAGES_BASE = '/anonymous-fys/';

export default defineConfig(({ command, mode }) => ({
  // Dev server stays at `/`; production build + `vite preview` use Pages base.
  base: command === 'serve' && mode === 'development' ? '/' : PAGES_BASE,
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@notes': resolve(__dirname, 'notes'),
    },
  },
  server: {
    fs: {
      // Repo root for notes/public; private media is served only via localStockingsPlugin.
      allow: ['.'],
    },
  },
  plugins: [localStockingsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
