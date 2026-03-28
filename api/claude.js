/** Vercel serverless: forwards JSON body to Anthropic Messages API */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' })
    return
  }
  const chunks = []
  await new Promise((resolve, reject) => {
    req.on('data', (c) => chunks.push(c))
    req.on('end', resolve)
    req.on('error', reject)
  })
  const body = Buffer.concat(chunks).toString('utf8')
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
  res.status(r.status)
  res.setHeader('content-type', 'application/json')
  res.send(text)
}
