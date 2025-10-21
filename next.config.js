import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow warnings during build, only fail on actual compilation errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip static generation for API routes (they need runtime env vars)
  experimental: {
    instrumentationHook: true,
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}, {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
})
