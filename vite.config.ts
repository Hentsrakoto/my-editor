import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',      // point de départ du frontend
  build: {
    outDir: '../../dist',    // build dans dist/ pour Electron
    emptyOutDir: true,
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
