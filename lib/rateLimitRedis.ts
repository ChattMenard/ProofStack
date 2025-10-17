import { NextApiRequest, NextApiResponse } from 'next'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 30 // 30 requests per minute per IP/user

// Initialize Upstash Redis (production) if credentials available
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS_PER_WINDOW, '1 m'),
    analytics: true,
    prefix: 'proofstack:ratelimit',
  })

  console.log('✅ Upstash Redis rate limiting enabled (production mode)')
} else {
  console.log('⚠️  Upstash Redis not configured, using in-memory rate limiting (dev mode)')
}

// Fallback: Simple in-memory store for development
interface RateLimitEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Get client identifier for rate limiting
 * Priority: authenticated user_id > IP address
 */
function getClientIdentifier(req: NextApiRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  
  // Get IP from various headers (Vercel, CloudFlare, etc.)
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : realIp || req.socket.remoteAddress || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Check rate limit using Upstash Redis (production)
 */
async function checkRateLimitRedis(
  identifier: string
): Promise<{
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}> {
  if (!ratelimit) {
    throw new Error('Upstash ratelimit not initialized')
  }

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  return {
    allowed: success,
    limit,
    remaining,
    resetAt: reset,
  }
}

/**
 * Check rate limit using in-memory store (development fallback)
 */
function checkRateLimitMemory(identifier: string): {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = memoryStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + RATE_LIMIT_WINDOW
    memoryStore.set(identifier, { count: 1, resetAt })
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetAt,
    }
  }

  // Existing window
  entry.count += 1

  const allowed = entry.count <= MAX_REQUESTS_PER_WINDOW
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count)

  return {
    allowed,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining,
    resetAt: entry.resetAt,
  }
}

/**
 * Check rate limit (automatically uses Redis or memory)
 */
export async function checkRateLimit(
  clientId: string
): Promise<{
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}> {
  if (ratelimit) {
    return await checkRateLimitRedis(clientId)
  } else {
    return checkRateLimitMemory(clientId)
  }
}

/**
 * Rate limiting middleware for API routes
 * Automatically uses Upstash Redis in production, in-memory in development
 * 
 * Usage:
 * 
 * export default withRateLimit(async function handler(req, res) {
 *   // Your handler code
 * })
 * 
 * Or with custom limits:
 * export default withRateLimit(handler, { maxRequests: 10, windowMs: 60000 })
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: {
    maxRequests?: number
    windowMs?: number
    getUserId?: (req: NextApiRequest) => Promise<string | undefined> | string | undefined
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get user ID if authentication is present
      let userId: string | undefined
      if (options?.getUserId) {
        userId = await options.getUserId(req)
      } else {
        // Try to get user from session
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            const token = authHeader.replace('Bearer ', '')
            const { data: { user } } = await supabase.auth.getUser(token)
            userId = user?.id
          } catch (e) {
            // Ignore auth errors, fall back to IP-based limiting
          }
        }
      }

      const clientId = getClientIdentifier(req, userId)
      
      // Use custom limits if provided, otherwise use defaults
      let result: { allowed: boolean; limit: number; remaining: number; resetAt: number }
      
      if (options?.maxRequests && ratelimit) {
        // Create custom rate limiter for this request
        const customLimiter = new Ratelimit({
          redis: redis!,
          limiter: Ratelimit.slidingWindow(
            options.maxRequests,
            `${Math.floor((options.windowMs || RATE_LIMIT_WINDOW) / 1000)} s`
          ),
          analytics: true,
          prefix: 'proofstack:ratelimit',
        })
        const { success, limit, remaining, reset } = await customLimiter.limit(clientId)
        result = { allowed: success, limit, remaining, resetAt: reset }
      } else {
        result = await checkRateLimit(clientId)
      }

      const { allowed, limit, remaining, resetAt } = result

      // Set rate limit headers (standard X-RateLimit-* headers)
      res.setHeader('X-RateLimit-Limit', limit.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString())
      
      // Add custom header to indicate Redis usage
      res.setHeader('X-RateLimit-Backend', ratelimit ? 'redis' : 'memory')

      if (!allowed) {
        // Rate limit exceeded
        res.setHeader('Retry-After', Math.ceil((resetAt - Date.now()) / 1000).toString())
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((resetAt - Date.now()) / 1000)} seconds.`,
          limit,
          resetAt: new Date(resetAt).toISOString(),
        })
      }

      // Continue to handler
      return await handler(req, res)
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request through (fail open)
      return await handler(req, res)
    }
  }
}

/**
 * Get current rate limit status for a client
 * Useful for displaying limits in UI
 */
export async function getRateLimitStatus(req: NextApiRequest, userId?: string) {
  const clientId = getClientIdentifier(req, userId)
  
  if (ratelimit) {
    // For Redis, we need to check the limit to get current status
    const { success, limit, remaining, reset } = await ratelimit.limit(clientId)
    return {
      limit,
      remaining: Math.max(0, remaining - 1), // Subtract the check itself
      resetAt: reset,
      used: limit - remaining + 1,
      backend: 'redis' as const,
    }
  } else {
    const entry = memoryStore.get(clientId)
    const now = Date.now()

    if (!entry || entry.resetAt < now) {
      return {
        limit: MAX_REQUESTS_PER_WINDOW,
        remaining: MAX_REQUESTS_PER_WINDOW,
        resetAt: now + RATE_LIMIT_WINDOW,
        used: 0,
        backend: 'memory' as const,
      }
    }

    return {
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
      resetAt: entry.resetAt,
      used: entry.count,
      backend: 'memory' as const,
    }
  }
}

/**
 * Clear rate limit for a specific client (useful for testing or admin override)
 * Only works with memory backend
 */
export function clearRateLimit(clientId: string) {
  if (!ratelimit) {
    memoryStore.delete(clientId)
    return { success: true, backend: 'memory' }
  } else {
    console.warn('clearRateLimit not supported with Redis backend')
    return { success: false, backend: 'redis', message: 'Use Redis commands directly' }
  }
}

/**
 * Get all rate limit entries (for monitoring/debugging)
 * Only works with memory backend
 */
export function getAllRateLimitEntries() {
  if (!ratelimit) {
    return Array.from(memoryStore.entries()).map(([clientId, entry]) => ({
      clientId,
      ...entry,
      backend: 'memory' as const,
    }))
  } else {
    return {
      backend: 'redis' as const,
      message: 'Use Upstash console for Redis analytics',
    }
  }
}

/**
 * Check if Upstash Redis is enabled
 */
export function isRedisEnabled(): boolean {
  return ratelimit !== null
}
