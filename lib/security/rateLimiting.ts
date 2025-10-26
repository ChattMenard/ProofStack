/**
 * Rate Limiting System
 * Prevents abuse, scraping, and DDoS attacks
 * Uses Upstash Redis (already configured in project)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Lazy initialize Redis client only when rate limiting is actually used
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }
  return redis;
}

/**
 * Rate limit tiers - adjust based on user type and endpoint sensitivity
 */
export const RATE_LIMITS = {
  // Work samples - most sensitive (potential scraping target)
  WORK_SAMPLE_VIEW: {
    requests: 50, // 50 requests
    window: '60 m' as const, // per hour
    message: 'Too many work sample views. Please wait before viewing more.',
  },
  WORK_SAMPLE_CREATE: {
    requests: 10,
    window: '60 m' as const,
    message: 'Too many work sample submissions. Please wait before submitting more.',
  },
  
  // AI analysis - expensive operations
  AI_ANALYSIS: {
    requests: 20,
    window: '60 m' as const,
    message: 'Too many AI analysis requests. Please wait before requesting more analysis.',
  },
  
  // Authentication - brute force protection
  AUTH_LOGIN: {
    requests: 5,
    window: '15 m' as const,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  AUTH_SIGNUP: {
    requests: 3,
    window: '60 m' as const,
    message: 'Too many signup attempts. Please wait before creating another account.',
  },
  
  // API endpoints - general protection
  API_GENERAL: {
    requests: 100,
    window: '1 m' as const,
    message: 'Too many requests. Please slow down.',
  },
  API_SEARCH: {
    requests: 30,
    window: '1 m' as const,
    message: 'Too many search requests. Please wait before searching again.',
  },
  
  // Profile views - scraping protection
  PROFILE_VIEW: {
    requests: 100,
    window: '60 m' as const,
    message: 'Too many profile views. Please wait before viewing more profiles.',
  },
  
  // Messaging - spam protection
  MESSAGE_SEND: {
    requests: 20,
    window: '60 m' as const,
    message: 'Too many messages sent. Please wait before sending more.',
  },
  
  // Upload - resource intensive
  UPLOAD: {
    requests: 10,
    window: '60 m' as const,
    message: 'Too many uploads. Please wait before uploading more files.',
  },
} as const;

/**
 * Create rate limiter for specific endpoint
 */
export function createRateLimiter(config: { requests: number; window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`; message: string }) {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(
      config.requests,
      config.window
    ),
    analytics: true, // Track metrics
    prefix: 'ratelimit',
  });
}

/**
 * Rate limit instances (cached)
 */
const rateLimiters = {
  workSampleView: createRateLimiter(RATE_LIMITS.WORK_SAMPLE_VIEW),
  workSampleCreate: createRateLimiter(RATE_LIMITS.WORK_SAMPLE_CREATE),
  aiAnalysis: createRateLimiter(RATE_LIMITS.AI_ANALYSIS),
  authLogin: createRateLimiter(RATE_LIMITS.AUTH_LOGIN),
  authSignup: createRateLimiter(RATE_LIMITS.AUTH_SIGNUP),
  apiGeneral: createRateLimiter(RATE_LIMITS.API_GENERAL),
  apiSearch: createRateLimiter(RATE_LIMITS.API_SEARCH),
  profileView: createRateLimiter(RATE_LIMITS.PROFILE_VIEW),
  messageSend: createRateLimiter(RATE_LIMITS.MESSAGE_SEND),
  upload: createRateLimiter(RATE_LIMITS.UPLOAD),
};

/**
 * Check rate limit for a user/IP
 */
export async function checkRateLimit(
  identifier: string, // user ID or IP address
  limiterType: keyof typeof rateLimiters
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  message?: string;
}> {
  const limiter = rateLimiters[limiterType];
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    message: result.success ? undefined : RATE_LIMITS[
      limiterType.replace(/([A-Z])/g, '_$1').toUpperCase().substring(1) as keyof typeof RATE_LIMITS
    ]?.message,
  };
}

/**
 * Middleware for Next.js API routes
 */
export async function withRateLimit(
  req: Request,
  limiterType: keyof typeof rateLimiters,
  getUserId?: () => Promise<string | null>
): Promise<Response | null> {
  // Get identifier (prefer user ID over IP)
  let identifier: string;
  
  if (getUserId) {
    const userId = await getUserId();
    if (userId) {
      identifier = `user:${userId}`;
    } else {
      // Fallback to IP
      identifier = `ip:${getClientIp(req)}`;
    }
  } else {
    identifier = `ip:${getClientIp(req)}`;
  }
  
  // Check rate limit
  const result = await checkRateLimit(identifier, limiterType);
  
  if (!result.success) {
    // Log rate limit violation
    console.warn('[RATE LIMIT] Exceeded', {
      identifier,
      limiterType,
      timestamp: new Date().toISOString(),
    });
    
    // Return 429 Too Many Requests
    return new Response(
      JSON.stringify({
        error: result.message || 'Rate limit exceeded',
        limit: result.limit,
        reset: result.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  // Rate limit OK, return null to continue
  return null;
}

/**
 * Get client IP from request
 */
function getClientIp(req: Request): string {
  // Check common headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback
  return 'unknown';
}

/**
 * Advanced: Detect and block suspicious patterns
 */
export async function detectSuspiciousActivity(
  userId: string,
  activityType: string
): Promise<{ suspicious: boolean; reason?: string }> {
  const redisClient = getRedis();
  const key = `suspicious:${userId}`;
  
  // Track activity counts
  const counts = await redisClient.hincrby(key, activityType, 1);
  await redisClient.expire(key, 3600); // 1 hour TTL
  
  // Define thresholds
  const THRESHOLDS = {
    work_sample_view: 200, // More than 200 views per hour = suspicious
    profile_view: 300,
    search: 500,
  };
  
  const threshold = THRESHOLDS[activityType as keyof typeof THRESHOLDS] || 1000;
  
  if (counts > threshold) {
    return {
      suspicious: true,
      reason: `Excessive ${activityType} activity: ${counts} in 1 hour`,
    };
  }
  
  return { suspicious: false };
}

/**
 * Block user temporarily
 */
export async function blockUser(
  userId: string,
  durationSeconds: number,
  reason: string
): Promise<void> {
  const redisClient = getRedis();
  const key = `blocked:${userId}`;
  await redisClient.setex(key, durationSeconds, reason);
  
  console.error('[SECURITY] User blocked', {
    userId,
    durationSeconds,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check if user is blocked
 */
export async function isUserBlocked(userId: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  const redisClient = getRedis();
  const key = `blocked:${userId}`;
  const reason = await redisClient.get(key);
  
  return {
    blocked: reason !== null,
    reason: reason ? String(reason) : undefined,
  };
}

/**
 * Get rate limit analytics
 */
export async function getRateLimitStats(
  limiterType: keyof typeof rateLimiters,
  timeRange: 'hour' | 'day' = 'hour'
): Promise<{
  totalRequests: number;
  blockedRequests: number;
  topIdentifiers: Array<{ identifier: string; count: number }>;
}> {
  // This would query Redis analytics
  // Implementation depends on your specific needs
  // For now, return placeholder
  return {
    totalRequests: 0,
    blockedRequests: 0,
    topIdentifiers: [],
  };
}

/**
 * Example usage in API route:
 * 
 * export async function GET(req: Request) {
 *   // Check rate limit
 *   const rateLimitResponse = await withRateLimit(
 *     req,
 *     'workSampleView',
 *     async () => {
 *       const { data: { user } } = await supabase.auth.getUser();
 *       return user?.id || null;
 *     }
 *   );
 *   
 *   if (rateLimitResponse) {
 *     return rateLimitResponse; // Rate limit exceeded
 *   }
 *   
 *   // Continue with normal logic
 *   // ...
 * }
 */

export default {
  checkRateLimit,
  withRateLimit,
  detectSuspiciousActivity,
  blockUser,
  isUserBlocked,
  getRateLimitStats,
};
