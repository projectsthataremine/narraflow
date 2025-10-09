import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src'),
  base: './',
  build: {
    outDir: path.join(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ui: path.join(__dirname, 'src/ui/index.html'),
        settings: path.join(__dirname, 'src/settings/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow access to project root for serving HTML files
      allow: [path.join(__dirname, 'src')],
    },
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
