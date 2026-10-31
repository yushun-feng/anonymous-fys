import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
});
