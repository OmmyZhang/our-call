import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: 'https://gcore.jsdelivr.net/gh/ommyzhang/our-call@gh-pages',
})
