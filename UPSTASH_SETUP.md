# Upstash Redis Rate Limiting Setup

## Overview

ProofStack supports **distributed rate limiting** using Upstash Redis for production multi-region Vercel deployments. This ensures rate limits work correctly across all edge functions globally.

---

## 🚀 Quick Setup

### Step 1: Create Upstash Redis Database

1. **Go to:** https://console.upstash.com/
2. **Sign up** or log in (free tier available)
3. **Create a new database:**
   - Click "Create Database"
   - Name: `proofstack-ratelimit`
   - Type: **Global** (for multi-region)
   - Region: Choose closest to your users
   - TLS: **Enabled** (recommended)

### Step 2: Get Redis Credentials

1. **Open your database** in Upstash console
2. **Scroll to "REST API"** section
3. **Copy two values:**
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Add to Environment Variables

**Local Development** (`.env.local`):
```bash
UPSTASH_REDIS_REST_URL=https://xxx-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxxxxxxxxxx
```

**Vercel Production**:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add both variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Apply to: **Production**, **Preview**, **Development**

### Step 4: Deploy

```bash
git add .
git commit -m "feat: add Upstash Redis rate limiting"
git push origin main
```

Vercel will automatically redeploy with Redis-based rate limiting!

---

## 📊 How It Works

### **Automatic Backend Selection**

```typescript
// In lib/rateLimitRedis.ts
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  // ✅ Production: Use Upstash Redis (distributed)
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
  })
} else {
  // 🏠 Development: Use in-memory (single instance)
  console.log('Using in-memory rate limiting')
}
```

### **Response Headers**

Both backends return standard headers:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1697558400
X-RateLimit-Backend: redis  ← Shows which backend is active
```

---

## 🔧 Configuration

### **Default Limits**

| Endpoint | Limit | Window | Backend |
|----------|-------|--------|---------|
| `/api/upload` | 10 | 1 min | Redis/Memory |
| `/api/analyze` | 20 | 1 min | Redis/Memory |
| `/api/github/*` | 30 | 1 min | Redis/Memory |
| Default | 30 | 1 min | Redis/Memory |

### **Custom Limits Per Endpoint**

```typescript
import { withRateLimit } from '@/lib/rateLimitRedis'

// Custom limit: 5 requests per minute
export default withRateLimit(handler, {
  maxRequests: 5,
  windowMs: 60000
})
```

### **Upstash Sliding Window**

Uses **sliding window** algorithm (more fair than fixed window):
- Distributes requests evenly over time
- Prevents burst abuse at window boundaries
- Smoother user experience

---

## 🌍 Multi-Region Benefits

### **Without Redis (In-Memory)**
```
User Request → Vercel Edge (US)     → Rate limit: 5 requests
User Request → Vercel Edge (Europe) → Rate limit: 5 requests (separate!)
Total: 10 requests (limit bypassed!) ❌
```

### **With Upstash Redis**
```
User Request → Vercel Edge (US)     → Redis → Rate limit: 5 requests
User Request → Vercel Edge (Europe) → Redis → Rate limit: 0 remaining
Total: 5 requests (limit enforced!) ✅
```

---

## 📈 Monitoring & Analytics

### **Upstash Console**

1. Go to: https://console.upstash.com/
2. Open your database
3. **Metrics tab** shows:
   - Requests per second
   - Latency (p50, p99)
   - Bandwidth usage
   - Error rate

### **Rate Limit Analytics**

Upstash Ratelimit automatically tracks:
- Number of requests per identifier
- Allow/deny ratios
- Peak usage times

Query in Redis:
```bash
# In Upstash console or CLI
KEYS proofstack:ratelimit:*
GET proofstack:ratelimit:user:xxx
```

### **Application Monitoring**

Check which backend is active:
```typescript
import { isRedisEnabled } from '@/lib/rateLimitRedis'

console.log('Redis enabled:', isRedisEnabled()) // true/false
```

---

## 💰 Pricing & Limits

### **Upstash Free Tier**
- **10,000 commands/day**
- **256 MB storage**
- **Global replication**
- **TLS encryption**
- Perfect for development and small apps

### **Cost Estimation**

For ProofStack with moderate traffic:
- 1 rate limit check = 2-3 Redis commands (GET + SET)
- 10,000 API requests/day = ~20,000-30,000 commands
- Free tier covers: **~3,000-5,000 API requests/day**

**Paid tier** ($0.20 per 100K commands):
- 1M API requests = ~$6/month
- Very affordable for most use cases

---

## 🧪 Testing

### **Test Local Setup**

```bash
# Without Upstash (should use memory)
npm run dev
# Check logs: "Using in-memory rate limiting"

# With Upstash (should use Redis)
# Add UPSTASH_* vars to .env.local
npm run dev
# Check logs: "✅ Upstash Redis rate limiting enabled"
```

### **Test Rate Limiting**

```bash
# Make rapid requests (should trigger 429 after limit)
for i in {1..35}; do
  curl -i http://localhost:3000/api/github/repos
done

# Check headers:
# X-RateLimit-Backend: redis
# X-RateLimit-Remaining: 0 (after 30 requests)
# Status: 429 Too Many Requests (after limit)
```

### **Verify Redis Connection**

```typescript
// Add to any API route temporarily
import { isRedisEnabled } from '@/lib/rateLimitRedis'

console.log('Redis status:', isRedisEnabled())
// Should log: true (if configured)
```

---

## 🔐 Security Best Practices

### **Protect Redis Credentials**

1. **Never commit** `.env.local` to git
2. **Rotate tokens** periodically in Upstash console
3. **Use Vercel Secrets** for production
4. **Enable TLS** in Upstash database settings

### **Rate Limit Strategy**

```typescript
// Authenticated users: Higher limits
// Anonymous users: Lower limits
export default withRateLimit(handler, {
  getUserId: async (req) => {
    const user = await getUser(req)
    return user?.id // Uses user ID for rate limiting
  }
})
```

---

## 🐛 Troubleshooting

### **"Using in-memory rate limiting" in production**

**Cause:** Environment variables not set in Vercel

**Fix:**
1. Go to Vercel project settings
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy

### **"429 Too Many Requests" immediately**

**Cause:** Rate limit already exceeded

**Fix:**
1. Check Upstash console for current counts
2. Wait for window to reset (check `X-RateLimit-Reset` header)
3. Or delete keys in Redis: `DEL proofstack:ratelimit:*`

### **High Redis latency (>100ms)**

**Cause:** Redis region too far from Vercel edge functions

**Fix:**
1. Create Upstash database in **Global** mode
2. Or create regional database closer to your users
3. Monitor latency in Upstash console

### **"Connection refused" errors**

**Cause:** Incorrect Redis URL or token

**Fix:**
1. Verify credentials in Upstash console
2. Check for trailing spaces in environment variables
3. Ensure TLS is enabled (https:// URL)

---

## 🔄 Migration Guide

### **Switching from In-Memory to Redis**

1. **Add Upstash credentials** to environment
2. **Restart dev server** or redeploy
3. **No code changes needed!** Automatic detection

### **Switching Back to In-Memory**

1. **Remove** `UPSTASH_REDIS_REST_URL` environment variable
2. **Restart** application
3. Falls back to memory automatically

---

## 📚 Alternative: Vercel KV (Upstash-powered)

Vercel offers **Vercel KV** (powered by Upstash) with tighter integration:

```bash
npm install @vercel/kv
```

Update `lib/rateLimitRedis.ts`:
```typescript
import { kv } from '@vercel/kv'
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
})
```

**Pros:**
- Automatic setup in Vercel
- Integrated billing
- Same Upstash backend

**Cons:**
- Vendor lock-in
- Only works on Vercel

---

## 🎯 Next Steps

After setting up Upstash:

1. **Deploy to production** and verify Redis backend
2. **Monitor usage** in Upstash console
3. **Adjust limits** based on traffic patterns
4. **Set up alerts** for high usage or errors
5. **Consider premium tier** if exceeding free limits

---

## 📖 References

- [Upstash Redis Docs](https://upstash.com/docs/redis)
- [Upstash Ratelimit SDK](https://github.com/upstash/ratelimit)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
