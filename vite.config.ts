import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type NextFn = (err?: unknown) => void

type ProxyRes = ServerResponse & {
  statusCode?: number
  setHeader: (k: string, v: string) => void
  end: (chunk?: string) => void
}

type ConnectLike = {
  use: (
    path: string,
    handler: (req: IncomingMessage, res: ProxyRes, next: NextFn) => void | Promise<void>,
  ) => void
}
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function attachLlmProxy(middlewares: ConnectLike, env: Record<string, string>) {
  middlewares.use('/api/claude', async (req: IncomingMessage, res: ProxyRes, next: NextFn) => {
    if (req.method !== 'POST') {
      next()
      return
    }
    const key = env.OPENROUTER_API_KEY
    if (!key) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Set OPENROUTER_API_KEY in .env' }))
      return
    }
    try {
      const body = await readBody(req as IncomingMessage)
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${key}`,
          'http-referer': env.VITE_APP_URL || 'http://localhost:5173',
          'x-title': 'Akuafo AI',
        },
        body,
      })
      const text = await r.text()
      res.statusCode = r.status
      res.setHeader('content-type', 'application/json')
      res.end(text)
    } catch (e) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      res.end(
        JSON.stringify({
          error: e instanceof Error ? e.message : 'Proxy error',
        }),
      )
    }
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'llm-api-proxy',
        configureServer(server) {
          attachLlmProxy(server.middlewares as unknown as ConnectLike, env)
        },
        configurePreviewServer(server) {
          attachLlmProxy(server.middlewares as unknown as ConnectLike, env)
        },
      },
    ],
  }
})
