'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false, // We'll capture manually
        capture_pageleave: true,
      })

      // Track initial page view
      posthog.capture('$pageview')
    }
  }, [])

  return <>{children}</>
}