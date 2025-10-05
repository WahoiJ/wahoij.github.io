import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

<<<<<<< HEAD
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
=======
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
>>>>>>> parent of 474e30d (本番環境と開発環境を分岐)
