/**
 * Model A/B Testing System
 * 
 * Enables experimentation with different AI models to optimize quality vs. cost.
 * Tracks metrics like accuracy, latency, cost, and user satisfaction.
 */

import { supabaseServer } from './supabaseServer'

const supabase = supabaseServer

// Model variants for different operations
export type ModelVariant = 
  | 'claude-opus'      // Highest quality, highest cost
  | 'claude-sonnet'    // Balanced quality/cost
  | 'claude-haiku'     // Fast, low cost
  | 'gpt-4'            // High quality, high cost
  | 'gpt-3.5-turbo'    // Fast, low cost
  | 'ollama-llama3'    // Free, local

export type Operation = 
  | 'skill-extraction'
  | 'code-analysis'
  | 'transcription'
  | 'summarization'

export interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'ollama'
  model: string
  temperature?: number
  maxTokens?: number
}

// Model configurations
export const MODEL_CONFIGS: Record<ModelVariant, ModelConfig> = {
  'claude-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    temperature: 0.3,
    maxTokens: 4096,
  },
  'claude-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3,
    maxTokens: 4096,
  },
  'claude-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    temperature: 0.3,
    maxTokens: 4096,
  },
  'gpt-4': {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4096,
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 4096,
  },
  'ollama-llama3': {
    provider: 'ollama',
    model: 'llama3',
    temperature: 0.3,
    maxTokens: 4096,
  },
}

// A/B test configurations
export interface ABTestConfig {
  name: string
  operation: Operation
  variants: {
    control: ModelVariant
    treatment: ModelVariant
  }
  trafficSplit: number // 0-100, percentage to treatment
  startDate: Date
  endDate?: Date
  isActive: boolean
}

// A/B test result metrics
export interface ABTestMetrics {
  variant: 'control' | 'treatment'
  modelVariant: ModelVariant
  sampleCount: number
  avgCost: number
  avgLatencyMs: number
  avgQualityScore?: number
  errorRate: number
  userSatisfaction?: number
}

/**
 * Determine which model variant to use based on A/B test configuration
 */
export async function selectModelVariant(
  operation: Operation,
  userId: string
): Promise<ModelVariant> {
  // Get active A/B test for this operation
  const { data: test } = await supabase
    .from('ab_tests')
    .select('*')
    .eq('operation', operation)
    .eq('is_active', true)
    .single()

  if (!test) {
    // No active test, use default model
    return getDefaultModel(operation)
  }

  // Determine variant based on user ID hash and traffic split
  const userHash = hashString(userId)
  const bucket = userHash % 100

  const variant = bucket < test.traffic_split ? 'treatment' : 'control'
  const modelVariant = test.variants[variant] as ModelVariant

  // Log assignment
  await logVariantAssignment(userId, test.id, variant, modelVariant)

  return modelVariant
}

/**
 * Log A/B test result with metrics
 */
export async function logABTestResult(params: {
  userId: string
  testId: string
  variant: 'control' | 'treatment'
  modelVariant: ModelVariant
  operation: Operation
  costUsd: number
  latencyMs: number
  success: boolean
  qualityScore?: number
  metadata?: Record<string, any>
}) {
  const { error } = await supabase
    .from('ab_test_results')
    .insert({
      user_id: params.userId,
      test_id: params.testId,
      variant: params.variant,
      model_variant: params.modelVariant,
      operation: params.operation,
      cost_usd: params.costUsd,
      latency_ms: params.latencyMs,
      success: params.success,
      quality_score: params.qualityScore,
      metadata: params.metadata,
      created_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to log A/B test result:', error)
  }
}

/**
 * Get A/B test metrics for analysis
 */
export async function getABTestMetrics(testId: string): Promise<{
  control: ABTestMetrics
  treatment: ABTestMetrics
}> {
  const { data: results } = await supabase
    .from('ab_test_results')
    .select('*')
    .eq('test_id', testId)

  if (!results || results.length === 0) {
    throw new Error('No results found for test')
  }

  const controlResults = results.filter((r: any) => r.variant === 'control')
  const treatmentResults = results.filter((r: any) => r.variant === 'treatment')

  return {
    control: calculateMetrics(controlResults, 'control'),
    treatment: calculateMetrics(treatmentResults, 'treatment'),
  }
}

/**
 * Calculate aggregate metrics from results
 */
function calculateMetrics(
  results: any[],
  variant: 'control' | 'treatment'
): ABTestMetrics {
  if (results.length === 0) {
    return {
      variant,
      modelVariant: 'claude-sonnet',
      sampleCount: 0,
      avgCost: 0,
      avgLatencyMs: 0,
      errorRate: 0,
    }
  }

  const totalCost = results.reduce((sum, r) => sum + (r.cost_usd || 0), 0)
  const totalLatency = results.reduce((sum, r) => sum + (r.latency_ms || 0), 0)
  const errorCount = results.filter(r => !r.success).length
  const qualityScores = results.filter(r => r.quality_score !== null).map(r => r.quality_score)

  return {
    variant,
    modelVariant: results[0].model_variant,
    sampleCount: results.length,
    avgCost: totalCost / results.length,
    avgLatencyMs: totalLatency / results.length,
    avgQualityScore: qualityScores.length > 0 
      ? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length
      : undefined,
    errorRate: errorCount / results.length,
  }
}

/**
 * Compare two variants and determine winner
 */
export function compareVariants(
  control: ABTestMetrics,
  treatment: ABTestMetrics
): {
  winner: 'control' | 'treatment' | 'no-difference'
  costSavings: number
  latencyImprovement: number
  qualityDifference?: number
  recommendation: string
} {
  const costSavings = ((control.avgCost - treatment.avgCost) / control.avgCost) * 100
  const latencyImprovement = ((control.avgLatencyMs - treatment.avgLatencyMs) / control.avgLatencyMs) * 100
  const qualityDifference = control.avgQualityScore && treatment.avgQualityScore
    ? ((treatment.avgQualityScore - control.avgQualityScore) / control.avgQualityScore) * 100
    : undefined

  // Simple decision logic (can be made more sophisticated)
  let winner: 'control' | 'treatment' | 'no-difference' = 'no-difference'
  let recommendation = ''

  if (treatment.errorRate > control.errorRate * 1.5) {
    winner = 'control'
    recommendation = 'Treatment has significantly higher error rate. Stick with control.'
  } else if (qualityDifference !== undefined && qualityDifference < -10) {
    winner = 'control'
    recommendation = 'Treatment quality is significantly lower. Stick with control.'
  } else if (costSavings > 20 && (qualityDifference === undefined || qualityDifference > -5)) {
    winner = 'treatment'
    recommendation = `Treatment saves ${costSavings.toFixed(1)}% on costs with acceptable quality.`
  } else if (latencyImprovement > 30 && (qualityDifference === undefined || qualityDifference > -5)) {
    winner = 'treatment'
    recommendation = `Treatment is ${latencyImprovement.toFixed(1)}% faster with acceptable quality.`
  } else {
    recommendation = 'No clear winner. Consider running test longer or adjusting criteria.'
  }

  return {
    winner,
    costSavings,
    latencyImprovement,
    qualityDifference,
    recommendation,
  }
}

/**
 * Log variant assignment for tracking
 */
async function logVariantAssignment(
  userId: string,
  testId: string,
  variant: 'control' | 'treatment',
  modelVariant: ModelVariant
) {
  await supabase
    .from('ab_test_assignments')
    .insert({
      user_id: userId,
      test_id: testId,
      variant,
      model_variant: modelVariant,
      assigned_at: new Date().toISOString(),
    })
}

/**
 * Simple hash function for consistent user bucketing
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get default model for operation (when no A/B test active)
 */
function getDefaultModel(operation: Operation): ModelVariant {
  const defaults: Record<Operation, ModelVariant> = {
    'skill-extraction': 'claude-sonnet',
    'code-analysis': 'claude-opus',
    'transcription': 'gpt-3.5-turbo',
    'summarization': 'claude-haiku',
  }
  return defaults[operation] || 'claude-sonnet'
}

/**
 * Create a new A/B test
 */
export async function createABTest(config: ABTestConfig) {
  const { error } = await supabase
    .from('ab_tests')
    .insert({
      name: config.name,
      operation: config.operation,
      variants: config.variants,
      traffic_split: config.trafficSplit,
      start_date: config.startDate.toISOString(),
      end_date: config.endDate?.toISOString(),
      is_active: config.isActive,
    })

  if (error) {
    throw new Error(`Failed to create A/B test: ${error.message}`)
  }
}

/**
 * Deactivate an A/B test
 */
export async function deactivateABTest(testId: string) {
  const { error } = await supabase
    .from('ab_tests')
    .update({ is_active: false })
    .eq('id', testId)

  if (error) {
    throw new Error(`Failed to deactivate A/B test: ${error.message}`)
  }
}
