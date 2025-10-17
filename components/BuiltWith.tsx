'use client'

/**
 * Built With Component
 * Displays logos of services and technologies powering ProofStack
 */

export default function BuiltWith() {
  const services = [
    {
      name: 'Vercel',
      logo: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png',
      url: 'https://vercel.com',
      category: 'Infrastructure'
    },
    {
      name: 'Supabase',
      logo: '/brand-assets/supabase-logo-wordmark--dark.png',
      url: 'https://supabase.com',
      category: 'Infrastructure'
    },
    {
      name: 'Cloudinary',
      logo: 'https://cloudinary-res.cloudinary.com/image/upload/c_scale,w_300/v1/logo/for_white_bg/cloudinary_logo_for_white_bg.svg',
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
      logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      url: 'https://github.com',
      category: 'Integration'
    },
    {
      name: 'Sentry',
      logo: 'https://sentry-brand.storage.googleapis.com/sentry-logo-black.svg',
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
        <p className="text-sm text-gray-600 font-medium">Built With</p>
      </div>
      <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
        {services.map((service) => (
          <a
            key={service.name}
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200"
            title={`${service.name} - ${service.category}`}
          >
            <img
              src={service.logo}
              alt={service.name}
              className="h-5 md:h-6 object-contain"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </div>
  )
}
