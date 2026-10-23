import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Dùng đường dẫn tương đối để chạy mượt trên cả Netlify lẫn Vercel
})
