# Rate Limiting & Cost Monitoring Implementation

## Overview

ProofStack now includes comprehensive **rate limiting** to prevent abuse and **cost tracking** to monitor LLM/transcription API usage and expenses.

---

## Rate Limiting

### Implementation

**In-memory rate limiting** (for single-instance deployments) using IP address and user ID as identifiers.

#### Features

- **30 requests per minute** per client (default)
- **IP-based** rate limiting for anonymous users
- **User-based** rate limiting for authenticated users
- Standard HTTP headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **429 Too Many Requests** response with `Retry-After` header
- **Fail-open** design: if rate limiting errors, requests are allowed through

#### Usage

```typescript
import { withRateLimit } from '@/lib/rateLimit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your handler code
}

// With default limits (30/minute)
export default withRateLimit(handler)

// With custom limits
export default withRateLimit(handler, {
  maxRequests: 10,
  windowMs: 60000 // 1 minute
})
```

#### Endpoint Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/api/upload` | 10 | 1 min | Heavy processing, prevent spam |
| `/api/analyze` | 20 | 1 min | Expensive LLM calls |
| `/api/github/*` | 30 | 1 min | External API dependency |
| Default | 30 | 1 min | General protection |

### Production Considerations

For **multi-instance** deployments (Vercel with multiple regions), migrate to **Redis-based rate limiting** using Upstash:

```typescript
// Future implementation with Upstash Redis
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
})
```

---

## Cost Tracking

### Database Schema

#### `api_cost_logs` Table

Tracks every API call to LLM and transcription services:

```sql
- user_id: Who made the request
- provider: 'openai', 'anthropic', 'huggingface', 'ollama'
- model_name: e.g., 'gpt-4', 'whisper-1', 'claude-3-sonnet'
- operation: 'transcription', 'skill_extraction', 'analysis'
- input_tokens, output_tokens, total_tokens
- cost_usd: Cost in USD (6 decimal precision)
- duration_ms: API call latency
- status: 'success', 'error', 'timeout', 'rate_limited'
```

#### Functions

- `get_user_total_cost(user_id)` - Get user's spending summary
- `get_cost_by_provider(user_id, days)` - Breakdown by provider/model
- `check_daily_budget(user_id, limit)` - Check if user exceeded budget

### Model Pricing (October 2024)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | GPT-4 | $0.03/1K tokens | $0.06/1K tokens |
| OpenAI | GPT-4 Turbo | $0.01/1K tokens | $0.03/1K tokens |
| OpenAI | GPT-3.5 Turbo | $0.0005/1K tokens | $0.0015/1K tokens |
| OpenAI | Whisper | - | $0.006/minute |
| Anthropic | Claude 3 Opus | $0.015/1K tokens | $0.075/1K tokens |
| Anthropic | Claude 3 Sonnet | $0.003/1K tokens | $0.015/1K tokens |
| Anthropic | Claude 3 Haiku | $0.00025/1K tokens | $0.00125/1K tokens |
| Ollama | All models | $0 | $0 (self-hosted) |

### Cost Logging

Automatic cost logging integrated into AI clients:

```typescript
import { logApiCost, calculateAnthropicCost } from '@/lib/costTracking'

// Logs are automatically created by updated clients
const response = await analyzeWithAnthropic(prompt, 'claude-3-sonnet', {
  userId: user.id,
  sampleId: sample.id,
  analysisId: analysis.id,
  operation: 'skill_extraction'
})
```

### Budget Limits

| Tier | Daily Limit | Per-Request Limit |
|------|-------------|-------------------|
| Free | $0.50/day | $0.05/analysis, $0.10/transcription |
| Pro | $5.00/day | $0.10/analysis, $0.20/transcription |
| Enterprise | $50.00/day | Custom |

### Cost Monitoring Dashboard

View at `/dashboard/costs` (component: `<CostMonitoring />`)

**Features:**
- Today, 7-day, 30-day, and all-time spending
- Request counts
- Breakdown by provider and model
- Cost alerts when exceeding thresholds
- Optimization tips

**API Endpoint:**
```
GET /api/costs/stats?days=30
```

Response:
```json
{
  "summary": {
    "totalCost": "$1.23",
    "requestCount": 145,
    "todayCost": "$0.05",
    "last7DaysCost": "$0.42",
    "last30DaysCost": "$1.23"
  },
  "breakdown": [
    {
      "provider": "anthropic",
      "model": "claude-3-sonnet",
      "requestCount": 89,
      "totalCost": "$0.67",
      "avgCost": "$0.0075"
    }
  ]
}
```

---

## Model Fallback Strategy

### Fallback Chains

ProofStack automatically selects models based on cost constraints and user tier:

#### Skill Extraction
1. **Claude 3 Sonnet** (best quality, $0.003/1K input)
2. **GPT-3.5 Turbo** (fast and cheap, $0.0005/1K input)
3. **Ollama Llama2** (free, self-hosted fallback)

#### Code Analysis
1. **Claude 3 Opus** (most capable, $0.015/1K input)
2. **Claude 3 Sonnet** (balanced)
3. **GPT-3.5 Turbo** (cost-effective)
4. **Ollama CodeLlama** (free, specialized for code)

#### Transcription
1. **OpenAI Whisper** ($0.006/minute, high quality)
2. **Ollama Whisper** (free, local processing)

### Smart Selection

```typescript
import { selectModelWithFallback, estimateTokens } from '@/lib/costTracking'

const text = "Analyze this code..."
const tokens = estimateTokens(text) // ~1 token per 4 chars

const { provider, model } = selectModelWithFallback(
  'skillExtraction',
  tokens,
  'free' // user tier
)

// Free tier prefers Ollama (free models)
// Pro tier uses Claude/GPT
```

### Budget Enforcement

```typescript
import { checkDailyBudget } from '@/lib/costTracking'

const { exceeded, used, limit } = await checkDailyBudget(userId, 'free')

if (exceeded) {
  // Automatically fallback to free models
  // or return error asking user to upgrade
}
```

---

## Cost Optimization Best Practices

### 1. Use Appropriate Models

- **Simple tasks** (skill extraction from text): GPT-3.5 or Claude Haiku
- **Complex tasks** (code analysis): GPT-4 or Claude Opus
- **Transcription** (audio/video): Whisper (no cheaper alternative)

### 2. Implement Caching

```typescript
// Already implemented for GitHub API
// Consider caching skill extraction results for similar content
```

### 3. Token Management

```typescript
// Truncate long prompts
const maxTokens = 4000
const truncatedText = text.slice(0, maxTokens * 4) // ~4 chars per token
```

### 4. Batch Processing

Process multiple samples in a single API call when possible:

```typescript
// Instead of 10 API calls for 10 files
// Batch into 1 call with all files
```

### 5. User Tier Enforcement

```typescript
// Free tier: Ollama only
// Pro tier: GPT-3.5, Claude Haiku
// Enterprise tier: All models
```

---

## Monitoring & Alerts

### Database Queries

**Total spending this month:**
```sql
SELECT SUM(cost_usd) FROM api_cost_logs
WHERE user_id = 'xxx'
  AND created_at >= DATE_TRUNC('month', NOW());
```

**Most expensive operations:**
```sql
SELECT operation, provider, model_name, COUNT(*), SUM(cost_usd)
FROM api_cost_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY operation, provider, model_name
ORDER BY SUM(cost_usd) DESC;
```

**Error rate by provider:**
```sql
SELECT provider, status, COUNT(*)
FROM api_cost_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider, status;
```

### Alerts

Set up alerts for:
- Daily spending > $5
- High error rates (>5%)
- Unusually expensive requests (>$0.50)
- Budget approaching limits (80% of daily cap)

---

## Migration

Apply the database migration:

```bash
# Development
supabase migration up

# Production
supabase db push
```

---

## Testing

### Rate Limiting Test

```bash
# Rapid requests should trigger 429
for i in {1..35}; do
  curl -i http://localhost:3000/api/github/repos
done
# After 30 requests, should return 429 Too Many Requests
```

### Cost Tracking Test

```typescript
// Make an API call with cost tracking
const result = await analyzeWithAnthropic('Test', 'claude-3-sonnet', {
  userId: 'test-user',
  operation: 'test'
})

// Check database
const { data } = await supabase
  .from('api_cost_logs')
  .select('*')
  .eq('user_id', 'test-user')
  .order('created_at', { ascending: false })
  .limit(1)

console.log('Cost logged:', data[0])
```

---

## Future Enhancements

1. **Real-time cost streaming**: WebSocket updates for live cost monitoring
2. **Cost projections**: Predict monthly costs based on usage patterns
3. **Budget alerts**: Email notifications when limits approached
4. **Per-sample cost**: Show cost breakdown on each portfolio item
5. **Batch discounts**: Negotiate volume pricing with providers
6. **Redis rate limiting**: Distribute rate limiting across Vercel regions
7. **Cost analytics**: Charts and trends over time
8. **Model A/B testing**: Compare quality vs. cost for different models

---

## References

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Upstash Ratelimit](https://github.com/upstash/ratelimit)
- [IETF Rate Limit Headers](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
