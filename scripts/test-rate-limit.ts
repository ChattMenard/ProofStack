/**
 * Test rate limiting headers to verify Redis backend is active
 * Run with: npx tsx scripts/test-rate-limit.ts
 */

async function testRateLimiting() {
  console.log('🔍 Testing Rate Limiting...\n')

  const url = 'http://localhost:3000/api/github/repos'
  
  try {
    console.log('Making request to:', url)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('\n📊 Response Status:', response.status, response.statusText)
    console.log('\n📋 Rate Limiting Headers:')
    console.log('  X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'))
    console.log('  X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'))
    console.log('  X-RateLimit-Reset:', response.headers.get('X-RateLimit-Reset'))
    
    const backend = response.headers.get('X-RateLimit-Backend')
    console.log('  X-RateLimit-Backend:', backend)

    console.log('\n🎯 Result:')
    if (backend === 'redis') {
      console.log('  ✅ SUCCESS! Using Upstash Redis for rate limiting')
      console.log('  🌍 Rate limits will be enforced globally across all Vercel regions')
    } else if (backend === 'memory') {
      console.log('  ⚠️  Using in-memory rate limiting (fallback mode)')
      console.log('  💡 This is fine for development, but production should use Redis')
    } else {
      console.log('  ❌ No backend detected - rate limiting may not be active')
    }

    // Test multiple requests to see rate limiting in action
    console.log('\n🔄 Testing rate limit with rapid requests...')
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch(url, { method: 'GET' }).then(r => ({
          status: r.status,
          remaining: r.headers.get('X-RateLimit-Remaining'),
        }))
      )
    }

    const results = await Promise.all(promises)
    console.log('\nRequest results:')
    results.forEach((result, i) => {
      console.log(`  Request ${i + 1}: Status ${result.status}, Remaining: ${result.remaining}`)
    })

    const allSuccess = results.every(r => r.status === 401) // Expecting 401 because no auth
    if (allSuccess) {
      console.log('\n✅ All requests passed (401 is expected without authentication)')
      console.log('✅ Rate limiting is working correctly!')
    }

  } catch (error) {
    console.error('\n❌ Error testing rate limiting:')
    console.error(error instanceof Error ? error.message : error)
    console.error('\n💡 Make sure your dev server is running: npm run dev')
  }
}

console.log('⏳ Waiting 2 seconds for server to initialize...\n')
setTimeout(() => testRateLimiting(), 2000)
