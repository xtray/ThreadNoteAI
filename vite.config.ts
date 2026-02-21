import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { Readable } from 'node:stream'

const customProviderProxyPlugin = (): Plugin => ({
  name: 'threadnote-custom-provider-proxy',
  configureServer(server) {
    server.middlewares.use('/api/custom/chat/completions', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8') || '{}';
        const payload = JSON.parse(rawBody) as Record<string, any>;

        const rawBaseUrl = typeof payload._threadnoteBaseUrl === 'string' ? payload._threadnoteBaseUrl : '';
        const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
        if (!baseUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: 'Missing custom provider base URL' } }));
          return;
        }
        delete payload._threadnoteBaseUrl;

        const authorization = req.headers.authorization;
        const upstream = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authorization ? { Authorization: authorization } : {}),
          },
          body: JSON.stringify(payload),
        });
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
        const cacheControl = upstream.headers.get('cache-control');
        if (cacheControl) {
          res.setHeader('Cache-Control', cacheControl);
        }

        if (upstream.body) {
          Readable.fromWeb(upstream.body as any).pipe(res);
          return;
        }
        res.end();
      } catch (error: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: { message: error?.message || 'Custom provider proxy failed' } }));
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), customProviderProxyPlugin()],
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
      // Anthropic API
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        secure: true,
      },
      // Google Gemini API
      '/api/google': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        secure: true,
      },
    },
  },
})
