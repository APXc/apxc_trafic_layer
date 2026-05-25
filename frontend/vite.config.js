import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://api:4000',
      '/socket.io': {
        target: 'http://api:4000',
        ws: true
      }
    }
  }
});
