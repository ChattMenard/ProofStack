/**
 * Test script to verify Upstash Redis connection
 * Run with: npx tsx scripts/test-redis.ts
 */

import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function testRedisConnection() {
  console.log('🔍 Testing Upstash Redis Connection...\n')

  // Check environment variables
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error('❌ Missing Upstash Redis credentials!')
    console.error('   UPSTASH_REDIS_REST_URL:', url ? '✓' : '✗')
    console.error('   UPSTASH_REDIS_REST_TOKEN:', token ? '✓' : '✗')
    process.exit(1)
  }

  console.log('✓ Environment variables found')
  console.log('  URL:', url)
  console.log('  Token:', token.substring(0, 20) + '...\n')

  try {
    // Initialize Redis client
    const redis = new Redis({
      url,
      token,
    })

    // Test 1: PING
    console.log('Test 1: PING')
    const pong = await redis.ping()
    console.log('  Response:', pong)
    console.log('  ✅ PING successful\n')

    // Test 2: SET a value
    console.log('Test 2: SET test key')
    const testKey = `test:${Date.now()}`
    await redis.set(testKey, 'Hello from ProofStack!', { ex: 60 })
    console.log('  Key:', testKey)
    console.log('  ✅ SET successful\n')

    // Test 3: GET the value
    console.log('Test 3: GET test key')
    const value = await redis.get(testKey)
    console.log('  Value:', value)
    console.log('  ✅ GET successful\n')

    // Test 4: INCR (for rate limiting)
    console.log('Test 4: INCR (rate limit counter)')
    const counterKey = `ratelimit:test:${Date.now()}`
    const count1 = await redis.incr(counterKey)
    const count2 = await redis.incr(counterKey)
    const count3 = await redis.incr(counterKey)
    console.log('  Counter values:', count1, count2, count3)
    console.log('  ✅ INCR successful\n')

    // Test 5: Cleanup
    console.log('Test 5: Cleanup')
    await redis.del(testKey, counterKey)
    console.log('  ✅ Cleanup successful\n')

    console.log('🎉 All tests passed! Upstash Redis is working correctly.\n')
    console.log('Next steps:')
    console.log('  1. Add these credentials to Vercel environment variables')
    console.log('  2. Deploy your app')
    console.log('  3. Rate limiting will automatically use Redis!')

  } catch (error) {
    console.error('\n❌ Redis connection failed!')
    console.error('Error:', error instanceof Error ? error.message : error)
    console.error('\nTroubleshooting:')
    console.error('  - Verify credentials at https://console.upstash.com/')
    console.error('  - Check that the database is active')
    console.error('  - Ensure you copied the full URL and token')
    process.exit(1)
  }
}

testRedisConnection()
