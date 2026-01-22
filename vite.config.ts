import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  publicDir: 'assets',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep PNG files in assets folder
          if (assetInfo.name?.endsWith('.png')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
