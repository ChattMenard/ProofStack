import '../styles/globals.css'
import { ReactNode } from 'react'
import Image from 'next/image'
import SupabaseWarning from '../components/SupabaseWarning'
import UserProfile from '../components/UserProfile'
import ThemeToggle from '../components/ThemeToggle'
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
      <body className="bg-forest-950 text-forest-50">
        <PostHogProvider>
          <div className="max-w-4xl mx-auto p-6">
            <header className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <a href="/">
                  <Image 
                    src="/logo.svg" 
                    alt="ProofStack" 
                    width={200} 
                    height={75}
                    priority
                  />
                </a>
                <span className="text-sm text-forest-400">(Demo)</span>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserProfile />
              </div>
            </header>
            <main>
              <SupabaseWarning />
              {children}
            </main>
            <footer className="mt-12 pt-6 border-t border-forest-800">
              <div className="flex flex-col items-center space-y-6">
                {/* Legal Links */}
                <div className="flex justify-center items-center space-x-4 text-sm text-forest-300">
                  <a href="/about" className="hover:text-sage-400 hover:underline">About</a>
                  <span>•</span>
                  <a href="/terms" className="hover:text-sage-400 hover:underline">Terms of Service</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-sage-400 hover:underline">Privacy Policy</a>
                  <span>•</span>
                  <a href="/contact" className="hover:text-sage-400 hover:underline">Contact</a>
                </div>
                
                {/* Built With Section */}
                <BuiltWith />
                
                {/* Copyright */}
                <div className="text-xs text-forest-400">
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
