'use client'

import { useEffect, useState } from 'react'

/**
 * Built With Component
 * Displays logos of services and technologies powering ProofStack
 */

export default function BuiltWith() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Watch for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = !document.documentElement.classList.contains('light')
      setTheme(isDark ? 'dark' : 'light')
    }
    
    checkTheme()
    
    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  const services = [
    {
      name: 'Vercel',
      logo: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png',
      url: 'https://vercel.com',
      category: 'Infrastructure'
    },
    {
      name: 'Supabase',
      logoDark: 'https://supabase.com/dashboard/_next/image?url=%2Fdashboard%2Fimg%2Fsupabase-logo.png&w=128&q=75',
      logoLight: 'https://supabase.com/dashboard/_next/image?url=%2Fdashboard%2Fimg%2Fsupabase-logo.png&w=128&q=75',
      url: 'https://supabase.com',
      category: 'Infrastructure',
      filterInDark: true // Add white filter in dark mode
    },
    {
      name: 'Cloudinary',
      logo: 'https://res.cloudinary.com/demo/image/upload/cloudinary_icon.png',
      url: 'https://cloudinary.com',
      category: 'Infrastructure'
    },
    {
      name: 'OpenAI',
      logo: 'https://openai.com/favicon.ico',
      url: 'https://openai.com',
      category: 'AI & Analysis'
    },
    {
      name: 'GitHub',
      logoDark: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      logoLight: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      url: 'https://github.com',
      category: 'Integration',
      invertInLight: true // GitHub logo should be inverted in light mode
    },
    {
      name: 'Sentry',
      logoDark: 'https://sentry-brand.storage.googleapis.com/sentry-logo-white.svg',
      logoLight: 'https://sentry-brand.storage.googleapis.com/sentry-logo-black.svg',
      url: 'https://sentry.io',
      category: 'Monitoring'
    },
    {
      name: 'PostHog',
      logo: 'https://posthog.com/brand/posthog-logo.svg',
      url: 'https://posthog.com',
      category: 'Analytics'
    }
  ]

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <p className="text-sm text-forest-300 font-medium">Built With</p>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
        {services.map((service) => {
          const logo = service.logoDark 
            ? (theme === 'dark' ? service.logoDark : service.logoLight)
            : service.logo
          
          return (
            <a
              key={service.name}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200"
              title={`${service.name} - ${service.category}`}
            >
              <img
                src={logo}
                alt={service.name}
                className={`h-5 md:h-6 object-contain ${
                  service.invertInLight && theme === 'light' ? 'invert' : ''
                } ${
                  service.filterInDark && theme === 'dark' ? 'brightness-0 invert' : ''
                }`}
                loading="lazy"
              />
            </a>
          )
        })}
      </div>
    </div>
  )
}
