import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Project Pages: https://yushun-feng.github.io/anonymous-fys/
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
      allow: ['.'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
