import '../styles/globals.css'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SupabaseWarning from '../components/SupabaseWarning'
import UserProfile from '../components/UserProfile'
import ThemeToggle from '../components/ThemeToggle'
import Navigation from '../components/Navigation'
import { PostHogProvider } from '../components/PostHogProvider'
import BuiltWith from '../components/BuiltWith'
import ScrollToTop from '../components/ScrollToTop'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata = {
  title: 'ProofStack - Verified Skills Portfolio',
  description: 'Build and share your verified skills portfolio with ProofStack. Transform your projects, contributions, and achievements into a professional portfolio.',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ProofStack - Verified Skills Portfolio',
    description: 'Build and share your verified skills portfolio with ProofStack',
    images: ['/og-image.svg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProofStack - Verified Skills Portfolio',
    description: 'Build and share your verified skills portfolio',
    images: ['/og-image.svg'],
  },
  themeColor: '#8fb569',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ProofStack',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ProofStack" />
      </head>
      <body className="bg-white text-gray-900 dark:bg-forest-950 dark:text-forest-50 relative">
        <PostHogProvider>
          {/* Sticky Header with Backdrop Blur */}
          <header className="sticky top-0 z-50 bg-white/80 dark:bg-forest-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-forest-800/50 relative">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Logo Section - Goldilocks Size */}
                <Link href="/" className="flex items-center gap-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-sage-500/20 dark:bg-sage-400/20 blur-xl rounded-full group-hover:bg-sage-500/30 dark:group-hover:bg-sage-400/30 transition-all duration-300"></div>
                    <Image 
                      src="/logo.svg" 
                      alt="ProofStack" 
                      width={280} 
                      height={100}
                      priority
                      className="relative transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-sage-400 dark:text-sage-300 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Beta Preview
                    </span>
                  </div>
                </Link>

                {/* Navigation & Actions */}
                <div className="flex items-center gap-6">
                  {/* Navigation Links */}
                  <Navigation />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <UserProfile />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
            <main>
              <SupabaseWarning />
              {children}
            </main>

            {/* Enhanced Footer */}
            <footer className="mt-16 pt-12 border-t border-forest-800/50 dark:border-gray-700/50">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                {/* Brand Column */}
                <div className="space-y-4">
                  <Image 
                    src="/logo.svg" 
                    alt="ProofStack" 
                    width={220} 
                    height={80}
                  />
                  <p className="text-sm text-forest-400 dark:text-gray-400">
                    Build and share your verified skills portfolio with confidence.
                  </p>
                </div>

                {/* Product Links */}
                <div>
                  <h4 className="font-semibold text-forest-200 dark:text-gray-200 mb-4">Product</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/pricing" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Pricing</Link></li>
                    <li><Link href="/dashboard" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Dashboard</Link></li>
                    <li><Link href="/upload" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Upload</Link></li>
                    <li><Link href="/portfolio" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Portfolio</Link></li>
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 className="font-semibold text-forest-200 dark:text-gray-200 mb-4">Company</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link href="/about" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">About</Link></li>
                    <li><Link href="/contact" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Contact</Link></li>
                    <li><Link href="/terms" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Terms</Link></li>
                    <li><Link href="/privacy" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Privacy</Link></li>
                    <li><Link href="/sitemap" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors">Sitemap</Link></li>
                  </ul>
                </div>

                {/* Social & Resources */}
                <div>
                  <h4 className="font-semibold text-forest-200 dark:text-gray-200 mb-4">Connect</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="https://github.com/ChattMenard/ProofStack" target="_blank" rel="noopener noreferrer" className="text-forest-400 dark:text-gray-400 hover:text-sage-400 dark:hover:text-sage-300 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a></li>
                  </ul>
                </div>
              </div>
                
              {/* Built With Section */}
              <div className="border-t border-forest-800/50 dark:border-gray-700/50 pt-8">
                <BuiltWith />
              </div>
                
              {/* Copyright */}
              <div className="text-center text-xs text-forest-500 dark:text-gray-500 mt-6">
                © {new Date().getFullYear()} ProofStack. All rights reserved. Made with 💚 for developers.
              </div>
            </footer>
          </div>

          {/* Scroll to Top Button */}
          <ScrollToTop />
          
          {/* Speed Insights */}
          <SpeedInsights />
        </PostHogProvider>
      </body>
    </html>
  )
}
