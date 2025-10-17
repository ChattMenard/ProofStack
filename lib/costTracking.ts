import supabaseServer from './supabaseServer'

// Model pricing (as of October 2024, in USD)
// Update these as pricing changes
export const MODEL_PRICING = {
  openai: {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 }, // per token
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
    'whisper-1': { perMinute: 0.006 }, // per minute of audio
  },
  anthropic: {
    'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
  },
  huggingface: {
    'distilbert': { perRequest: 0.00001 }, // Very cheap inference
    'bart-large-cnn': { perRequest: 0.00005 },
  },
  ollama: {
    'llama2': { perRequest: 0 }, // Self-hosted, free
    'codellama': { perRequest: 0 },
    'mistral': { perRequest: 0 },
  },
}

// Cost thresholds for automatic fallback (in USD)
export const COST_THRESHOLDS = {
  // Daily limits
  dailyLimit: {
    free: 0.50, // $0.50/day for free users
    pro: 5.00, // $5.00/day for pro users
    enterprise: 50.00, // $50.00/day for enterprise
  },
  // Per-request limits
  perRequest: {
    transcription: 0.10, // Max $0.10 per transcription
    analysis: 0.05, // Max $0.05 per analysis
  },
}

// Model fallback chains (ordered from most capable to most cost-effective)
export const MODEL_FALLBACK_CHAINS = {
  transcription: [
    { provider: 'openai', model: 'whisper-1', maxDurationMinutes: 30 },
    { provider: 'ollama', model: 'whisper', maxDurationMinutes: Infinity }, // Fallback to local
  ],
  skillExtraction: [
    { provider: 'anthropic', model: 'claude-3-sonnet', maxTokens: 4000 },
    { provider: 'openai', model: 'gpt-3.5-turbo', maxTokens: 4000 },
    { provider: 'ollama', model: 'llama2', maxTokens: Infinity }, // Free fallback
  ],
  codeAnalysis: [
    { provider: 'anthropic', model: 'claude-3-opus', maxTokens: 8000 },
    { provider: 'anthropic', model: 'claude-3-sonnet', maxTokens: 8000 },
    { provider: 'openai', model: 'gpt-3.5-turbo', maxTokens: 4000 },
    { provider: 'ollama', model: 'codellama', maxTokens: Infinity },
  ],
}

interface CostLogOptions {
  userId?: string
  sampleId?: string
  analysisId?: string
  provider: string
  modelName: string
  operation: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  costUsd: number
  durationMs?: number
  requestSizeBytes?: number
  responseSizeBytes?: number
  status?: 'success' | 'error' | 'timeout' | 'rate_limited'
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Log API cost to database for tracking and analytics
 */
export async function logApiCost(options: CostLogOptions) {
  try {
    const { error } = await supabaseServer
      .from('api_cost_logs')
      .insert({
        user_id: options.userId,
        sample_id: options.sampleId,
        analysis_id: options.analysisId,
        provider: options.provider,
        model_name: options.modelName,
        operation: options.operation,
        input_tokens: options.inputTokens,
        output_tokens: options.outputTokens,
        total_tokens: options.totalTokens,
        cost_usd: options.costUsd,
        duration_ms: options.durationMs,
        request_size_bytes: options.requestSizeBytes,
        response_size_bytes: options.responseSizeBytes,
        status: options.status || 'success',
        error_message: options.errorMessage,
        metadata: options.metadata || {},
      })

    if (error) {
      console.error('Failed to log API cost:', error)
    }

    return { success: !error }
  } catch (error) {
    console.error('Error logging API cost:', error)
    return { success: false }
  }
}

/**
 * Calculate cost for OpenAI API calls
 */
export function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING.openai[model as keyof typeof MODEL_PRICING.openai]
  if (!pricing || !('input' in pricing)) return 0

  return inputTokens * pricing.input + outputTokens * pricing.output
}

/**
 * Calculate cost for Anthropic API calls
 */
export function calculateAnthropicCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING.anthropic[model as keyof typeof MODEL_PRICING.anthropic]
  if (!pricing) return 0

  return inputTokens * pricing.input + outputTokens * pricing.output
}

/**
 * Calculate cost for Whisper transcription
 */
export function calculateWhisperCost(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60
  const pricing = MODEL_PRICING.openai['whisper-1']
  return durationMinutes * pricing.perMinute
}

/**
 * Check if user has exceeded their daily budget
 */
export async function checkDailyBudget(
  userId: string,
  userTier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{ exceeded: boolean; used: number; limit: number }> {
  try {
    const { data, error } = await supabaseServer.rpc('get_user_total_cost', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Failed to check daily budget:', error)
      return { exceeded: false, used: 0, limit: COST_THRESHOLDS.dailyLimit[userTier] }
    }

    const todayCost = data?.[0]?.today_cost || 0
    const limit = COST_THRESHOLDS.dailyLimit[userTier]

    return {
      exceeded: todayCost >= limit,
      used: todayCost,
      limit,
    }
  } catch (error) {
    console.error('Error checking daily budget:', error)
    return { exceeded: false, used: 0, limit: COST_THRESHOLDS.dailyLimit[userTier] }
  }
}

/**
 * Get cost statistics for a user
 */
export async function getUserCostStats(userId: string) {
  try {
    const { data, error } = await supabaseServer.rpc('get_user_total_cost', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Failed to get user cost stats:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Error getting user cost stats:', error)
    return null
  }
}

/**
 * Get cost breakdown by provider
 */
export async function getCostByProvider(userId: string, days: number = 30) {
  try {
    const { data, error } = await supabaseServer.rpc('get_cost_by_provider', {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      console.error('Failed to get cost by provider:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting cost by provider:', error)
    return []
  }
}

/**
 * Select optimal model based on cost constraints and fallback chain
 */
export function selectModelWithFallback(
  operation: keyof typeof MODEL_FALLBACK_CHAINS,
  estimatedTokens: number,
  userTier: 'free' | 'pro' | 'enterprise' = 'free'
): { provider: string; model: string } {
  const chain = MODEL_FALLBACK_CHAINS[operation]

  for (const option of chain) {
    // Check token limits
    if ('maxTokens' in option && estimatedTokens > option.maxTokens) {
      continue
    }

    // For free tier, prefer free models (Ollama)
    if (userTier === 'free' && option.provider !== 'ollama') {
      // Skip paid models for free tier if free option exists
      const hasFreeOption = chain.some(o => o.provider === 'ollama')
      if (hasFreeOption) continue
    }

    return { provider: option.provider, model: option.model }
  }

  // Return last option as ultimate fallback
  const fallback = chain[chain.length - 1]
  return { provider: fallback.provider, model: fallback.model }
}

/**
 * Estimate tokens for text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Format cost for display
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${(costUsd * 100).toFixed(4)}¢`
  }
  return `$${costUsd.toFixed(2)}`
}
