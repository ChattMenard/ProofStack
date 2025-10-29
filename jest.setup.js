// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Load test environment variables
import { loadEnvConfig } from '@next/env'

const projectDir = process.cwd()
loadEnvConfig(projectDir, true, { info: () => {}, error: console.error })

// Mock environment variables for tests if not set
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Polyfill Web Fetch API Request/Response/Headers for Next.js app-route imports in Jest
import { Request, Response, Headers } from 'node-fetch'
if (typeof globalThis.Request === 'undefined') {
	globalThis.Request = Request
}
if (typeof globalThis.Response === 'undefined') {
	globalThis.Response = Response
}
if (typeof globalThis.Headers === 'undefined') {
	globalThis.Headers = Headers
}