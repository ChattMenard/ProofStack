import '../styles/globals.css'
import { ReactNode } from 'react'
import SupabaseWarning from '../components/SupabaseWarning'
import UserProfile from '../components/UserProfile'
import { PostHogProvider } from '../components/PostHogProvider'

export const metadata = {
  title: 'ProofStack - Verified Skills Portfolio',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <div className="max-w-4xl mx-auto p-6">
            <header className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-semibold">ProofStack (Demo)</h1>
              <div>
                <UserProfile />
              </div>
            </header>
            <main>
              <SupabaseWarning />
              {children}
            </main>
            <footer className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center space-y-3">
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
                  <a href="/terms" className="hover:text-blue-600 hover:underline">Terms of Service</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:text-blue-600 hover:underline">Privacy Policy</a>
                  <span>•</span>
                  <a href="/contact" className="hover:text-blue-600 hover:underline">Contact</a>
                </div>
                <div className="flex justify-center items-center space-x-2 text-sm text-gray-600">
                  <span>Powered by</span>
                  <img 
                    src="/brand-assets/supabase-logo-wordmark--dark.png" 
                    alt="Supabase" 
                    className="h-5" 
                  />
                </div>
              </div>
            </footer>
          </div>
        </PostHogProvider>
      </body>
    </html>
  )
}
