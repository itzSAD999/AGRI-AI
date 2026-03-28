import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type NextFn = (err?: unknown) => void

type ClaudeProxyRes = ServerResponse & {
  statusCode?: number
  setHeader: (k: string, v: string) => void
  end: (chunk?: string) => void
}

type ConnectLike = {
  use: (
    path: string,
    handler: (req: IncomingMessage, res: ClaudeProxyRes, next: NextFn) => void | Promise<void>,
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

function attachClaudeProxy(middlewares: ConnectLike, env: Record<string, string>) {
  middlewares.use('/api/claude', async (req: IncomingMessage, res: ClaudeProxyRes, next: NextFn) => {
    if (req.method !== 'POST') {
      next()
      return
    }
    const key = env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY
    if (!key) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Set ANTHROPIC_API_KEY in .env' }))
      return
    }
    try {
      const body = await readBody(req as IncomingMessage)
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
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
        name: 'claude-api-proxy',
        configureServer(server) {
          attachClaudeProxy(server.middlewares as unknown as ConnectLike, env)
        },
        configurePreviewServer(server) {
          attachClaudeProxy(server.middlewares as unknown as ConnectLike, env)
        },
      },
    ],
  }
})
