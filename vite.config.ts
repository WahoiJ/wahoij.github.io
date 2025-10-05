import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // SSL プラグインを追加
  ],
  base: '/myNewSite/', // GitHub Pagesのリポジトリ名に合わせて変更
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  server: {
    https: true,
    host: 'localhost',
    port: 5173
  }
})