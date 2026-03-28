import { CLAUDE_MODEL } from '../agents/agentConfigs'

type Message = { role: 'user' | 'assistant'; content: string }

export async function callClaude(params: {
  system: string
  messages: Message[]
  maxTokens: number
  temperature: number
}): Promise<string> {
  const openRouterMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: params.system },
    ...params.messages,
  ]

  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      messages: openRouterMessages,
    }),
  })
  const raw = await res.text()
  if (!res.ok) {
    let msg = raw || res.statusText
    try {
      const j = JSON.parse(raw) as {
        error?: { message?: string; code?: number } | string
      }
      if (typeof j.error === 'string') msg = j.error
      else if (j.error && typeof j.error === 'object' && 'message' in j.error) {
        msg = String(j.error.message)
      }
    } catch {
      /* ignore */
    }
    if (msg.includes('OPENROUTER_API_KEY') || res.status === 500) {
      msg = `${msg} — For local dev, add OPENROUTER_API_KEY to .env and restart Vite.`
    }
    throw new Error(msg)
  }
  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty model response')
  return text
}
