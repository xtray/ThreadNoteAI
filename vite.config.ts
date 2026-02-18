import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // MiniMax API
      '/api/minimax': {
        target: 'https://api.minimax.chat/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/minimax/, ''),
        secure: true,
      },
      // 智谱 GLM API
      '/api/glm': {
        target: 'https://open.bigmodel.cn/api/paas/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/glm/, ''),
        secure: true,
      },
      // DeepSeek API
      '/api/deepseek': {
        target: 'https://api.deepseek.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        secure: true,
      },
      // OpenAI API
      '/api/openai': {
        target: 'https://api.openai.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        secure: true,
      },
    },
  },
})
