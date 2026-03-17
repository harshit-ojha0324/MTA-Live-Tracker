import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.BACKEND_URL || 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
