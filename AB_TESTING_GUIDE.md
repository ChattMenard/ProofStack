# Model A/B Testing System

## Overview

The Model A/B Testing system enables data-driven optimization of AI model selection by comparing different models on real production workloads. This helps balance **quality vs. cost** tradeoffs.

## Features

- ✅ **Multiple Model Support**: Test Claude Opus, Sonnet, Haiku, GPT-4, GPT-3.5, and local Ollama models
- ✅ **Traffic Splitting**: Control percentage of users assigned to treatment vs. control
- ✅ **Automatic Metrics**: Track cost, latency, error rate, and quality scores
- ✅ **Statistical Analysis**: Calculate significance and determine winners
- ✅ **User Consistency**: Same user always gets same variant within a test

## Quick Start

### 1. Apply Database Migration

```bash
# Using Supabase CLI
npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres"

# Or manually via SQL Editor
# Copy and paste contents of supabase/migrations/005_model_ab_testing.sql
```

### 2. Create an A/B Test

```typescript
import { createABTest } from '@/lib/modelABTesting'

await createABTest({
  name: 'Skill Extraction: Sonnet vs Haiku',
  operation: 'skill-extraction',
  variants: {
    control: 'claude-sonnet',    // Current model
    treatment: 'claude-haiku',   // Cheaper alternative
  },
  trafficSplit: 20,  // 20% of users get treatment
  startDate: new Date(),
  isActive: true,
})
```

### 3. Use in Your Code

```typescript
import { selectModelVariant } from '@/lib/modelABTesting'

// Automatically selects appropriate variant based on active A/B tests
const modelVariant = await selectModelVariant('skill-extraction', userId)

// Use the selected model
const config = MODEL_CONFIGS[modelVariant]
// ... call your AI service
```

### 4. Log Results

```typescript
import { logABTestResult } from '@/lib/modelABTesting'

await logABTestResult({
  userId,
  testId,
  variant: 'treatment',
  modelVariant: 'claude-haiku',
  operation: 'skill-extraction',
  costUsd: 0.00015,
  latencyMs: 1250,
  success: true,
  qualityScore: 85.5,  // Optional 0-100 score
})
```

### 5. Analyze Results

```typescript
import { getABTestMetrics, compareVariants } from '@/lib/modelABTesting'

const metrics = await getABTestMetrics(testId)
const comparison = compareVariants(metrics.control, metrics.treatment)

console.log(comparison.winner)           // 'control' | 'treatment' | 'no-difference'
console.log(comparison.costSavings)      // Percentage cost difference
console.log(comparison.recommendation)    // Human-readable advice
```

## Model Variants

### Available Models

| Variant | Provider | Use Case | Cost/1K | Speed |
|---------|----------|----------|---------|-------|
| `claude-opus` | Anthropic | Highest quality analysis | $0.015 | Slow |
| `claude-sonnet` | Anthropic | Balanced quality/cost | $0.003 | Medium |
| `claude-haiku` | Anthropic | Fast, simple tasks | $0.00025 | Fast |
| `gpt-4` | OpenAI | Complex reasoning | $0.03 | Slow |
| `gpt-3.5-turbo` | OpenAI | General purpose | $0.0005 | Fast |
| `ollama-llama3` | Ollama | Local, no cost | $0.00 | Medium |

### Default Models by Operation

| Operation | Default Model | Reason |
|-----------|--------------|---------|
| `skill-extraction` | `claude-sonnet` | Good balance of accuracy and cost |
| `code-analysis` | `claude-opus` | Needs deep understanding |
| `transcription` | `gpt-3.5-turbo` | Fast, accurate for audio |
| `summarization` | `claude-haiku` | Speed matters more than depth |

## A/B Test Dashboard

Access the dashboard at `/dashboard/ab-tests` (admin only):

```tsx
import ABTestDashboard from '@/components/ABTestDashboard'

export default function ABTestPage() {
  return <ABTestDashboard />
}
```

### Dashboard Features

1. **Create Tests**: Configure operation, models, and traffic split
2. **Monitor Active Tests**: See real-time sample counts and status
3. **View Results**: Compare control vs. treatment metrics
4. **Statistical Significance**: Auto-calculates winner and recommendations

## Example: Cost Optimization Test

### Scenario
You want to reduce skill extraction costs without sacrificing quality.

### Setup
```typescript
await createABTest({
  name: 'Skill Extraction Cost Optimization',
  operation: 'skill-extraction',
  variants: {
    control: 'claude-sonnet',   // Current: $0.003/1K
    treatment: 'claude-haiku',  // Testing: $0.00025/1K (12x cheaper!)
  },
  trafficSplit: 30,  // Start conservative
  startDate: new Date(),
  isActive: true,
})
```

### Monitor
After 100+ samples per variant:
```typescript
const metrics = await getABTestMetrics(testId)

// Control (claude-sonnet)
// - Avg cost: $0.0012
// - Quality: 92.5
// - Error rate: 1.2%

// Treatment (claude-haiku)
// - Avg cost: $0.0001  // ✅ 92% cost savings!
// - Quality: 89.3      // ⚠️ Slight quality drop
// - Error rate: 2.1%   // ⚠️ Slightly higher errors
```

### Decision
```typescript
const comparison = compareVariants(metrics.control, metrics.treatment)
// winner: 'treatment'
// costSavings: 91.67%
// qualityDifference: -3.5%
// recommendation: "Treatment saves 91.7% on costs with acceptable quality."
```

**Action**: Roll out Haiku to 100% of users for skill extraction → **Save ~$500/month**

## Best Practices

### 1. Start Small
```typescript
trafficSplit: 10  // Only 10% of users in treatment initially
```

### 2. Run Long Enough
- **Minimum**: 30 samples per variant
- **Recommended**: 100+ samples for statistical confidence
- **Duration**: 1-2 weeks to capture usage patterns

### 3. Monitor Quality
```typescript
// Add quality scoring to your results
qualityScore: calculateQuality(result)  // 0-100 based on your criteria
```

### 4. Test One Thing at a Time
- ❌ Don't test model + prompt changes simultaneously
- ✅ Test model change first, then prompt change in separate test

### 5. Watch Error Rates
```typescript
if (treatment.errorRate > control.errorRate * 1.5) {
  // Treatment has 50% more errors - probably not worth it
  await deactivateABTest(testId)
}
```

## Database Schema

### Tables

**ab_tests**
- `id`, `name`, `operation`, `variants` (JSONB), `traffic_split`, `is_active`
- Stores test configurations

**ab_test_assignments**
- `test_id`, `user_id`, `variant`, `model_variant`, `assigned_at`
- Ensures user consistency (same user = same variant)

**ab_test_results**
- `test_id`, `user_id`, `variant`, `cost_usd`, `latency_ms`, `success`, `quality_score`
- Stores individual execution metrics

### Functions

**get_ab_test_summary(test_id)**
```sql
SELECT * FROM get_ab_test_summary('test-uuid');
-- Returns: variant, sample_count, avg_cost, avg_latency, error_rate, etc.
```

**calculate_ab_test_significance(test_id, metric)**
```sql
SELECT * FROM calculate_ab_test_significance('test-uuid', 'cost');
-- Returns: control_mean, treatment_mean, difference_pct, is_significant
```

## Common Use Cases

### 1. Cost Reduction
**Goal**: Reduce costs by 50% without quality loss
```typescript
variants: {
  control: 'claude-opus',    // $0.015/1K
  treatment: 'claude-sonnet', // $0.003/1K (5x cheaper)
}
```

### 2. Latency Improvement
**Goal**: Reduce response time for better UX
```typescript
variants: {
  control: 'gpt-4',          // Slow but accurate
  treatment: 'gpt-3.5-turbo', // 3x faster
}
```

### 3. Quality Improvement
**Goal**: Better analysis quality at higher cost
```typescript
variants: {
  control: 'claude-sonnet',   // Current baseline
  treatment: 'claude-opus',   // Testing if quality boost is worth 5x cost
}
```

### 4. Local vs. Cloud
**Goal**: Move workloads to free local Ollama
```typescript
variants: {
  control: 'claude-haiku',    // Cloud: $0.00025/1K
  treatment: 'ollama-llama3', // Local: $0.00/1K
}
```

## API Reference

### `selectModelVariant(operation, userId)`
Returns appropriate model variant based on active tests and user assignment.

### `logABTestResult(params)`
Records metrics from an execution for later analysis.

### `getABTestMetrics(testId)`
Retrieves aggregated metrics for control and treatment variants.

### `compareVariants(control, treatment)`
Analyzes two variants and recommends a winner.

### `createABTest(config)`
Creates and optionally activates a new A/B test.

### `deactivateABTest(testId)`
Stops a running test (e.g., if treatment is clearly worse).

## Troubleshooting

### No variant assigned
**Issue**: `selectModelVariant()` returns default model instead of test variant
**Fix**: Check that test is `is_active = true` and traffic_split > 0

### Results show 0 samples
**Issue**: No data in `ab_test_results` table
**Fix**: Ensure you're calling `logABTestResult()` after each execution

### Winner is "no-difference"
**Issue**: Not enough data or differences too small
**Fix**: Run test longer (need 30+ samples) or increase traffic_split

### Significance not detected
**Issue**: `is_significant = false` in SQL function
**Fix**: Need 30+ samples per variant AND >10% metric difference

## Cost Savings Calculator

Estimate potential savings from optimizing models:

| Current Model | New Model | Cost Reduction | Monthly Savings (10K requests) |
|---------------|-----------|----------------|-------------------------------|
| GPT-4 → GPT-3.5 | 98.3% | $290 → $5 | **$285/month** |
| Claude Opus → Sonnet | 80% | $150 → $30 | **$120/month** |
| Claude Sonnet → Haiku | 91.7% | $30 → $2.50 | **$27.50/month** |
| Any Cloud → Ollama | 100% | $X → $0 | **$X/month** |

## Next Steps

1. ✅ Apply migration: `005_model_ab_testing.sql`
2. ✅ Create your first A/B test in dashboard
3. ✅ Integrate `selectModelVariant()` into your code
4. ✅ Monitor metrics for 1-2 weeks
5. ✅ Roll out winner to 100% of users
6. ✅ Start next optimization test

**Continuous optimization = Lower costs + Better quality over time!**
