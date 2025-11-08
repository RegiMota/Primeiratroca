import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 3001, // Porta diferente do site principal
    open: false,
    strictPort: true,
  },
  root: './',
});


