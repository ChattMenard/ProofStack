import fetch from 'node-fetch'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

export async function analyzeWithAnthropic(prompt: string, model = 'claude-2') {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  const resp = await fetch('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Anthropic-Version': '2023-06-01',
      'Content-Type': 'application/json',
      'X-API-Key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model,
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 1000
    })
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Anthropic error: ${resp.status} ${body}`)
  }

  const json = await resp.json()
  return json.completion || ''
}

export default analyzeWithAnthropic