import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseServer } from './supabaseServer'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 30 // 30 requests per minute per IP/user

// Simple in-memory store (for development/single instance)
// For production with multiple instances, use Redis (Upstash)
interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
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
 * Check if request should be rate limited
 * Returns { allowed: boolean, limit, remaining, resetAt }
 */
export function checkRateLimit(clientId: string): {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(clientId)

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + RATE_LIMIT_WINDOW
    rateLimitStore.set(clientId, { count: 1, resetAt })
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetAt
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
    resetAt: entry.resetAt
  }
}

/**
 * Rate limiting middleware for API routes
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
            const token = authHeader.replace('Bearer ', '')
            const { data: { user } } = await supabaseServer.auth.getUser(token)
            userId = user?.id
          } catch {
            // Ignore auth errors, fall back to IP-based limiting
          }
        }
      }

      const clientId = getClientIdentifier(req, userId)
      const { allowed, limit, remaining, resetAt } = checkRateLimit(clientId)

      // Set rate limit headers (standard X-RateLimit-* headers)
      res.setHeader('X-RateLimit-Limit', limit.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', Math.floor(resetAt / 1000).toString())

      if (!allowed) {
        // Rate limit exceeded
        res.setHeader('Retry-After', Math.ceil((resetAt - Date.now()) / 1000).toString())
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((resetAt - Date.now()) / 1000)} seconds.`,
          limit,
          resetAt: new Date(resetAt).toISOString()
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
export function getRateLimitStatus(req: NextApiRequest, userId?: string) {
  const clientId = getClientIdentifier(req, userId)
  const entry = rateLimitStore.get(clientId)
  const now = Date.now()

  if (!entry || entry.resetAt < now) {
    return {
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetAt: now + RATE_LIMIT_WINDOW,
      used: 0
    }
  }

  return {
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
    resetAt: entry.resetAt,
    used: entry.count
  }
}

/**
 * Clear rate limit for a specific client (useful for testing or admin override)
 */
export function clearRateLimit(clientId: string) {
  rateLimitStore.delete(clientId)
}

/**
 * Get all rate limit entries (for monitoring/debugging)
 */
export function getAllRateLimitEntries() {
  return Array.from(rateLimitStore.entries()).map(([clientId, entry]) => ({
    clientId,
    ...entry
  }))
}
