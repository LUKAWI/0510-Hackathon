import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },

  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (
            id.includes('node_modules/@radix-ui/') ||
            id.includes('node_modules/lucide-react/') ||
            id.includes('node_modules/sonner/') ||
            id.includes('node_modules/class-variance-authority/') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')
          ) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/@antv/')) {
            return 'graph-vendor';
          }
          if (id.includes('node_modules/@tanstack/')) {
            return 'query-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
