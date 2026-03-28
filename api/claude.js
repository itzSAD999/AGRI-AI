/** Vercel serverless: forwards JSON body to OpenRouter chat completions API */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })
    return
  }
  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (c) => chunks.push(c))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const body = Buffer.concat(chunks).toString('utf8')
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${key}`,
      'http-referer': process.env.VITE_APP_URL || 'https://suafo-ai.vercel.app',
      'x-title': 'Akuafo AI',
    },
    body,
  })
  const text = await r.text()
  res.status(r.status)
  res.setHeader('content-type', 'application/json')
  res.send(text)
}
