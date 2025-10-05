import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // SSL プラグインを追加
  ],
  server: {
    https: true,
    host: 'localhost',
    port: 5173
  }
})