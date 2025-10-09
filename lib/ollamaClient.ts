import fetch from 'node-fetch'

const OLLAMA_URL = process.env.OLLAMA_URL || ''

export async function analyzeWithOllama(prompt: string, model = 'llama2') {
  if (!OLLAMA_URL) throw new Error('OLLAMA_URL not configured')

  const resp = await fetch(`${OLLAMA_URL}/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, max_tokens: 512 })
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Ollama error: ${resp.status} ${body}`)
  }

  const json = await resp.json()
  // Expecting `json.output` or similar; return raw for now
  return json
}
