'use client'

export default function AboutPage() {
  const techStack = [
    {
      category: 'Infrastructure & Hosting',
      services: [
        {
          name: 'Vercel',
          description: 'Serverless deployment platform providing fast, global edge network hosting',
          logo: 'https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_dark_background.png',
          url: 'https://vercel.com',
          use: 'Hosting, CI/CD, Edge Functions'
        },
        {
          name: 'Supabase',
          description: 'Open-source Firebase alternative with PostgreSQL database and authentication',
          logo: '/brand-assets/supabase-logo-wordmark--dark.png',
          url: 'https://supabase.com',
          use: 'Database, Authentication, Real-time subscriptions'
        },
        {
          name: 'Cloudinary',
          description: 'Cloud-based media management platform for image and video upload/optimization',
          logo: 'https://cloudinary-res.cloudinary.com/image/upload/c_scale,w_300/v1/logo/for_white_bg/cloudinary_logo_for_white_bg.svg',
          url: 'https://cloudinary.com',
          use: 'File storage, Media processing, CDN delivery'
        }
      ]
    },
    {
      category: 'AI & Analysis',
      services: [
        {
          name: 'OpenAI',
          description: 'Advanced AI models for natural language processing and audio transcription',
          logo: 'https://openai.com/favicon.ico',
          url: 'https://openai.com',
          use: 'Skill extraction, Code analysis, Whisper transcription'
        },
        {
          name: 'Anthropic',
          description: 'AI safety company creating reliable, interpretable AI systems (Claude)',
          url: 'https://anthropic.com',
          use: 'Alternative AI analysis, Fallback processing'
        },
        {
          name: 'Hugging Face',
          description: 'Open-source platform for machine learning models and datasets',
          logo: 'https://huggingface.co/front/assets/huggingface_logo.svg',
          url: 'https://huggingface.co',
          use: 'Alternative ML models, Community datasets'
        }
      ]
    },
    {
      category: 'Developer Tools & Integration',
      services: [
        {
          name: 'GitHub',
          description: 'Version control and collaboration platform for developers',
          logo: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
          url: 'https://github.com',
          use: 'OAuth authentication, Repository verification, Code analysis'
        },
        {
          name: 'Next.js',
          description: 'React framework for production-grade applications',
          logo: 'https://nextjs.org/static/favicon/favicon.ico',
          url: 'https://nextjs.org',
          use: 'Frontend framework, SSR, API routes'
        }
      ]
    },
    {
      category: 'Monitoring & Analytics',
      services: [
        {
          name: 'Sentry',
          description: 'Application monitoring and error tracking platform',
          logo: 'https://sentry-brand.storage.googleapis.com/sentry-logo-black.svg',
          url: 'https://sentry.io',
          use: 'Error monitoring, Performance tracking, Issue alerts'
        },
        {
          name: 'PostHog',
          description: 'Open-source product analytics platform',
          logo: 'https://posthog.com/brand/posthog-logo.svg',
          url: 'https://posthog.com',
          use: 'User analytics, Feature flags, Session recording'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ProofStack</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            ProofStack is built on a modern tech stack, leveraging best-in-class services
            to provide secure, scalable, and intelligent skill verification.
          </p>
        </div>

        {/* Tech Stack Sections */}
        <div className="space-y-12">
          {techStack.map((section) => (
            <div key={section.category} className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-3">
                {section.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.services.map((service) => (
                  <a
                    key={service.name}
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-4">
                      {service.logo && (
                        <img
                          src={service.logo}
                          alt={service.name}
                          className="h-10 w-10 object-contain flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {service.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          <strong>Used for:</strong> {service.use}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Open Source & Credits */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Open Source & Community</h2>
          <p className="text-gray-700 mb-4">
            ProofStack is built with open-source technologies and wouldn't be possible without
            the incredible work of the developer community.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              React
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              TypeScript
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              Tailwind CSS
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              PostgreSQL
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              Jest
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
              Playwright
            </span>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security & Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">HTTPS/TLS</h3>
              <p className="text-sm text-gray-600">End-to-end encryption for all data</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">GDPR & CCPA</h3>
              <p className="text-sm text-gray-600">Full compliance with data protection laws</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-semibold text-gray-900 mb-2">OAuth 2.0</h3>
              <p className="text-sm text-gray-600">Secure authentication with industry standards</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
