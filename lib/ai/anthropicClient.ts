import fetch from 'node-fetch'
import { logApiCost, calculateAnthropicCost, estimateTokens } from '../costTracking'
import { detectSecrets } from '../security'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

export async function analyzeWithAnthropic(
  prompt: string,
  model = 'claude-3-sonnet',
  options?: {
    userId?: string
    sampleId?: string
    analysisId?: string
    operation?: string
  }
) {
  // Defense-in-depth: don't send prompts that contain secrets
  try {
    const secretCheck = detectSecrets(prompt)
    if (secretCheck.found) {
      throw new Error('Prompt contains potential secrets; aborting call to Anthropic')
    }
  } catch (err) {
    // Early fail to avoid exfiltration
    throw err
  }
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  const startTime = Date.now()
  const requestBody = JSON.stringify({
    model,
    prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
    max_tokens_to_sample: 1000
  })

  try {
    const resp = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Anthropic-Version': '2023-06-01',
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY
      },
      body: requestBody
    })

    const duration = Date.now() - startTime

    if (!resp.ok) {
      const body = await resp.text()
      
      // Log error for cost tracking
      await logApiCost({
        userId: options?.userId,
        sampleId: options?.sampleId,
        analysisId: options?.analysisId,
        provider: 'anthropic',
        modelName: model,
        operation: options?.operation || 'analysis',
        costUsd: 0,
        durationMs: duration,
        requestSizeBytes: Buffer.byteLength(requestBody),
        status: 'error',
        errorMessage: `${resp.status}: ${body.slice(0, 200)}`
      })

      throw new Error(`Anthropic error: ${resp.status} ${body}`)
    }

    const json = await resp.json()
    const completion = json.completion || ''
    
    // Calculate tokens and cost
    const inputTokens = estimateTokens(prompt)
    const outputTokens = estimateTokens(completion)
    const totalTokens = inputTokens + outputTokens
    const cost = calculateAnthropicCost(model, inputTokens, outputTokens)

    // Log cost
    await logApiCost({
      userId: options?.userId,
      sampleId: options?.sampleId,
      analysisId: options?.analysisId,
      provider: 'anthropic',
      modelName: model,
      operation: options?.operation || 'analysis',
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd: cost,
      durationMs: duration,
      requestSizeBytes: Buffer.byteLength(requestBody),
      responseSizeBytes: Buffer.byteLength(JSON.stringify(json)),
      status: 'success'
    })

    return completion
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // Log error
    await logApiCost({
      userId: options?.userId,
      sampleId: options?.sampleId,
      analysisId: options?.analysisId,
      provider: 'anthropic',
      modelName: model,
      operation: options?.operation || 'analysis',
      costUsd: 0,
      durationMs: duration,
      requestSizeBytes: Buffer.byteLength(requestBody),
      status: 'error',
      errorMessage: error.message
    })

    throw error
  }
}

export default analyzeWithAnthropic