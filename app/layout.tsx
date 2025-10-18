import '../styles/globals.css'
import { ReactNode } from 'react'
import Image from 'next/image'
import SupabaseWarning from '../components/SupabaseWarning'
import UserProfile from '../components/UserProfile'
import { PostHogProvider } from '../components/PostHogProvider'
import BuiltWith from '../components/BuiltWith'

export const metadata = {
  title: 'ProofStack - Verified Skills Portfolio',
  description: 'Build and share your verified skills portfolio with ProofStack. Transform your projects, contributions, and achievements into a professional portfolio.',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-icon.svg',
  },
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
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <div className="max-w-4xl mx-auto p-6">
            <header className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.svg" 
                  alt="ProofStack" 
                  width={200} 
                  height={75}
                  priority
                />
                <span className="text-sm text-gray-500">(Demo)</span>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="/login" 
                  className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                >
                  Sign In
                </a>
                <a 
                  href="/dashboard" 
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </a>
                <UserProfile />
              </div>
            </header>
            <main>
              <SupabaseWarning />
              {children}
            </main>
            <footer className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center space-y-6">
                {/* Legal Links */}
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
                  <a href="/about" className="hover:text-blue-600 hover:underline">About</a>
                  <span>•</span>
                  <a href="/terms" className="hover:text-blue-600 hover:underline">Terms of Service</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-blue-600 hover:underline">Privacy Policy</a>
                  <span>•</span>
                  <a href="/contact" className="hover:text-blue-600 hover:underline">Contact</a>
                </div>
                
                {/* Built With Section */}
                <BuiltWith />
                
                {/* Copyright */}
                <div className="text-xs text-gray-500">
                  © {new Date().getFullYear()} ProofStack. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        </PostHogProvider>
      </body>
    </html>
  )
}
