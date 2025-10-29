import fetch from 'node-fetch'
import { detectSecrets } from './security'

const OLLAMA_URL = process.env.OLLAMA_URL || ''

export async function analyzeWithOllama(prompt: string, model = 'llama2') {
  // Defense-in-depth: don't send prompts that contain secrets
  const secretCheck = detectSecrets(prompt)
  if (secretCheck.found) {
    throw new Error('Prompt contains potential secrets; aborting call to Ollama')
  }

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
