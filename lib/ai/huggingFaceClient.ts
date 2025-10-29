import fetch from 'node-fetch'
import { detectSecrets } from '../security'

const HF_TOKEN = process.env.HF_TOKEN || ''

export async function analyzeWithHuggingFace(prompt: string, model = 'microsoft/DialoGPT-medium') {
  // Defense-in-depth: don't send prompts that contain secrets
  const secretCheck = detectSecrets(prompt)
  if (secretCheck.found) {
    throw new Error('Prompt contains potential secrets; aborting call to Hugging Face')
  }

  if (!HF_TOKEN) throw new Error('HF_TOKEN not configured')

  const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 512, temperature: 0.7 }
    })
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Hugging Face error: ${resp.status} ${body}`)
  }

  const json = await resp.json()
  // HF returns array of objects with generated_text
  const output = Array.isArray(json) ? json[0]?.generated_text : json.generated_text
  return output || ''
}

export default analyzeWithHuggingFace