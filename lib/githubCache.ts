/**
 * GitHub API Cache Service
 * Implements ETag-based caching for GitHub API responses
 * Reduces rate limiting and improves performance
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceRole)

interface CacheEntry {
  url: string
  user_id: string
  etag: string
  response_data: any
  cached_at: string
  expires_at: string
}

/**
 * Get cached response if valid, otherwise return null
 */
export async function getCachedResponse(userId: string, url: string): Promise<CacheEntry | null> {
  try {
    const { data, error } = await supabase
      .from('github_api_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('url', url)
      .single()

    if (error || !data) return null

    // Check if cache is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      // Cache expired, delete it
      await supabase
        .from('github_api_cache')
        .delete()
        .eq('user_id', userId)
        .eq('url', url)
      return null
    }

    return data
  } catch (err) {
    console.error('Cache read error:', err)
    return null
  }
}

/**
 * Save response to cache with ETag
 */
export async function setCachedResponse(
  userId: string,
  url: string,
  etag: string,
  responseData: any,
  cacheDurationMinutes: number = 60
): Promise<void> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + cacheDurationMinutes * 60 * 1000)

    await supabase
      .from('github_api_cache')
      .upsert({
        user_id: userId,
        url,
        etag,
        response_data: responseData,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'user_id,url'
      })
  } catch (err) {
    console.error('Cache write error:', err)
  }
}

/**
 * Make a conditional GitHub API request with ETag support
 */
export async function fetchGitHubWithCache(
  url: string,
  githubToken: string,
  userId: string,
  cacheDurationMinutes: number = 60
): Promise<{ data: any; fromCache: boolean; rateLimitRemaining?: number }> {
  // Try to get cached response
  const cached = await getCachedResponse(userId, url)

  const headers: Record<string, string> = {
    'Authorization': `token ${githubToken}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ProofStack-App'
  }

  // If we have a cached ETag, use conditional request
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag
  }

  const response = await fetch(url, { headers })

  const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
  const rateLimitReset = response.headers.get('x-ratelimit-reset')

  console.log(`GitHub API: ${url}`)
  console.log(`Rate limit remaining: ${rateLimitRemaining}`)
  if (rateLimitReset) {
    const resetDate = new Date(parseInt(rateLimitReset) * 1000)
    console.log(`Rate limit resets at: ${resetDate.toISOString()}`)
  }

  // 304 Not Modified - use cached data
  if (response.status === 304 && cached) {
    console.log('✓ Using cached GitHub response (304 Not Modified)')
    return {
      data: cached.response_data,
      fromCache: true,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined
    }
  }

  // 200 OK - new data
  if (response.status === 200) {
    const data = await response.json()
    const etag = response.headers.get('etag')

    // Save to cache if we got an ETag
    if (etag) {
      await setCachedResponse(userId, url, etag, data, cacheDurationMinutes)
      console.log('✓ Cached new GitHub response with ETag')
    }

    return {
      data,
      fromCache: false,
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined
    }
  }

  // Other status codes - throw error
  const errorText = await response.text()
  throw new Error(`GitHub API error: ${response.status} ${errorText}`)
}

/**
 * Clear cache for a specific user
 */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    await supabase
      .from('github_api_cache')
      .delete()
      .eq('user_id', userId)
    console.log(`✓ Cleared GitHub API cache for user ${userId}`)
  } catch (err) {
    console.error('Cache clear error:', err)
  }
}

/**
 * Clear expired cache entries (run periodically)
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const now = new Date().toISOString()
    await supabase
      .from('github_api_cache')
      .delete()
      .lt('expires_at', now)
    console.log('✓ Cleared expired GitHub API cache entries')
  } catch (err) {
    console.error('Expired cache clear error:', err)
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
  totalEntries: number
  expiredEntries: number
  cacheSize: number
}> {
  try {
    const { count: totalEntries } = await supabase
      .from('github_api_cache')
      .select('*', { count: 'exact', head: true })

    const now = new Date().toISOString()
    const { count: expiredEntries } = await supabase
      .from('github_api_cache')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', now)

    // Estimate cache size (rough calculation)
    const { data } = await supabase
      .from('github_api_cache')
      .select('response_data')
      .limit(100)

    let cacheSize = 0
    if (data) {
      const avgSize = data.reduce((sum: number, entry: any) => {
        return sum + JSON.stringify(entry.response_data).length
      }, 0) / data.length
      cacheSize = avgSize * (totalEntries || 0)
    }

    return {
      totalEntries: totalEntries || 0,
      expiredEntries: expiredEntries || 0,
      cacheSize: Math.round(cacheSize / 1024) // KB
    }
  } catch (err) {
    console.error('Cache stats error:', err)
    return { totalEntries: 0, expiredEntries: 0, cacheSize: 0 }
  }
}
