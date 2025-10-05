import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  
  return {
    plugins: [
      react(),
      basicSsl()
    ],
    base: isProduction ? '/myNewSite/' : '/', // 本番時のみリポジトリ名を使用
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
  }
})