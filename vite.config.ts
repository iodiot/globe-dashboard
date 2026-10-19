import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/globe-dashboard/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 },
});
