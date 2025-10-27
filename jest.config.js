import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Replace internal rate limit module with a lightweight mock during tests to avoid importing Upstash/uncrypto
    '^@/lib/rateLimitRedis$': '<rootDir>/__mocks__/rateLimitRedis.js',
    // Mock Upstash packages which are ESM and cause Jest parse errors
    '^@upstash/redis$': '<rootDir>/__mocks__/upstash-redis.js',
    '^@upstash/ratelimit$': '<rootDir>/__mocks__/upstash-ratelimit.js',
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
    // Ensure ESM-only 'node-fetch' is replaced with a simple CJS mock during Jest runs
    '^node-fetch$': '<rootDir>/__mocks__/node-fetch.js',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'pages/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  // Ignore patterns for fuzz tests in regular test runs
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/e2e/'],
  // Allow transforming a small set of ESM node_modules that Jest chokes on by default
  // (some packages export ESM; include them so babel-jest can transform)
  transformIgnorePatterns: ['/node_modules/(?!(uncrypto)/)'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)