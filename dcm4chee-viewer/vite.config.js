import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy for dcm4chee API
      '/api': {
        target: 'https://172.16.16.221:8080',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          // Log proxy requests for debugging
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying API request:', req.method, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        }
      },
      // Proxy for Keycloak authentication
      '/auth': {
        target: 'https://172.16.16.221:8843',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying Auth request:', req.method, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Auth proxy error:', err);
          });
        }
      }
    }
  }
})