import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // 🔥 CORS для фронта на 3001
  server: {
    port: 3000,
    cors: {
      origin: "http://localhost:3001",
      credentials: true
    }
  }
})
