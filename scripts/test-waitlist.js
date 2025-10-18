#!/usr/bin/env node
/**
 * Test script for the waitlist API endpoint
 * Usage: node scripts/test-waitlist.js
 */

const testEmail = `test+${Date.now()}@example.com`
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testWaitlistAPI() {
  console.log('🧪 Testing Waitlist API')
  console.log(`📧 Using test email: ${testEmail}`)
  console.log(`🌐 Base URL: ${baseUrl}`)
  console.log('')

  try {
    // Test 1: Valid email signup
    console.log('Test 1: Valid email signup...')
    const response1 = await fetch(`${baseUrl}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })

    const result1 = await response1.json()
    console.log(`Status: ${response1.status}`)
    console.log(`Response:`, result1)
    console.log('')

    // Test 2: Duplicate email (should handle gracefully)
    console.log('Test 2: Duplicate email signup...')
    const response2 = await fetch(`${baseUrl}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })

    const result2 = await response2.json()
    console.log(`Status: ${response2.status}`)
    console.log(`Response:`, result2)
    console.log('')

    // Test 3: Invalid email
    console.log('Test 3: Invalid email...')
    const response3 = await fetch(`${baseUrl}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const result3 = await response3.json()
    console.log(`Status: ${response3.status}`)
    console.log(`Response:`, result3)
    console.log('')

    console.log('✅ Waitlist API tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run tests
testWaitlistAPI()