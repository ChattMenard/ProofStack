"use client"
import Link from 'next/link';
import { useState } from 'react';

export default function SitemapPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['public', 'auth', 'professional', 'employer', 'admin']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const pages = {
    public: {
      title: "Public Pages",
      icon: "🌐",
      items: [
        { path: "/", name: "Home", description: "Landing page" },
        { path: "/about", name: "About", description: "About ProofStack" },
        { path: "/pricing", name: "Pricing", description: "Pricing plans" },
        { path: "/contact", name: "Contact", description: "Contact form" },
        { path: "/privacy", name: "Privacy Policy", description: "Privacy policy" },
        { path: "/terms", name: "Terms of Service", description: "Terms of service" },
        { path: "/sitemap", name: "Sitemap", description: "This page" },
      ]
    },
    auth: {
      title: "Authentication",
      icon: "🔐",
      items: [
        { path: "/login", name: "Sign In", description: "Login page" },
        { path: "/auth/signup", name: "Sign Up", description: "Registration page" },
        { path: "/auth/callback", name: "OAuth Callback", description: "OAuth redirect handler" },
      ]
    },
    professional: {
      title: "Professional Dashboard",
      icon: "👨‍💻",
      items: [
        { path: "/professional/dashboard", name: "Dashboard", description: "Professional home" },
        { path: "/professional/settings", name: "Settings", description: "Profile settings & AI analysis" },
        { path: "/professional/messages", name: "Messages", description: "Inbox & conversations" },
        { path: "/professional/upload", name: "Upload", description: "Upload work samples" },
        { path: "/portfolio/[username]", name: "Portfolio", description: "Public portfolio page" },
      ]
    },
    employer: {
      title: "Employer Dashboard",
      icon: "🏢",
      items: [
        { path: "/employer/dashboard", name: "Dashboard", description: "Employer home" },
        { path: "/employer/discover", name: "Discover", description: "Browse professionals" },
        { path: "/employer/messages", name: "Messages", description: "Inbox & conversations" },
        { path: "/employer/reviews", name: "Reviews", description: "Manage reviews" },
        { path: "/employer/reviews/new/[professionalId]", name: "Write Review", description: "Submit review + work sample" },
        { path: "/employer/organization", name: "Organization", description: "Company settings" },
      ]
    },
    admin: {
      title: "Admin Panel",
      icon: "⚙️",
      items: [
        { path: "/admin", name: "Admin Dashboard", description: "Platform administration" },
      ]
    },
    api: {
      title: "API Routes",
      icon: "🔌",
      items: [
        { path: "/api/professional/proof-score-v2", name: "ProofScore V2", description: "GET - Fetch ProofScore breakdown" },
        { path: "/api/professional/analyze-profile", name: "Analyze Profile", description: "POST - AI profile analysis" },
        { path: "/api/professional/analyze-message", name: "Analyze Message", description: "POST - AI message analysis" },
        { path: "/api/work-samples/analyze", name: "Analyze Work Sample", description: "POST - AI work sample quality analysis" },
        { path: "/api/reviews/create", name: "Create Review", description: "POST - Submit review + work sample" },
        { path: "/api/analyze-text-quality", name: "Text Quality", description: "POST - General text analysis" },
      ]
    }
  };

  const fileTree = {
    title: "Project File Structure",
    icon: "📁",
    sections: [
      {
        name: "app/",
        description: "Next.js 14 App Router",
        children: [
          { name: "(auth)/", description: "Auth layout group" },
          { name: "about/", description: "About page" },
          { name: "admin/", description: "Admin panel" },
          { name: "api/", description: "API routes", highlight: true },
          { name: "auth/", description: "Authentication pages" },
          { name: "checkout/", description: "Stripe checkout" },
          { name: "contact/", description: "Contact page" },
          { name: "dashboard/", description: "Generic dashboard" },
          { name: "employer/", description: "Employer pages", highlight: true },
          { name: "portfolio/", description: "Professional portfolios" },
          { name: "pricing/", description: "Pricing page" },
          { name: "privacy/", description: "Privacy policy" },
          { name: "professional/", description: "Professional pages", highlight: true },
          { name: "terms/", description: "Terms of service" },
          { name: "upload/", description: "Upload pages" },
          { name: "layout.tsx", description: "Root layout" },
          { name: "page.tsx", description: "Home page" },
        ]
      },
      {
        name: "components/",
        description: "React Components",
        children: [
          { name: "ProofScoreV2.tsx", description: "30/30/40 ProofScore display", highlight: true },
          { name: "WorkSamplesSection.tsx", description: "Work samples portfolio display", highlight: true },
          { name: "AuthForm.tsx", description: "Authentication form" },
          { name: "ReviewsSection.tsx", description: "Reviews display" },
          { name: "messages/", description: "Message components" },
        ]
      },
      {
        name: "supabase/migrations/",
        description: "Database Migrations",
        children: [
          { name: "add_work_samples.sql", description: "Work samples table + AI analysis", highlight: true },
          { name: "proof_score_v2.sql", description: "ProofScore V2 calculations" },
          { name: "employer_reviews.sql", description: "Review system" },
        ]
      },
      {
        name: "lib/",
        description: "Utilities & Helpers",
        children: [
          { name: "supabaseClient.ts", description: "Supabase client" },
          { name: "email/", description: "Email notifications" },
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Header */}
      <div className="bg-forest-900 border-b border-forest-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-forest-50 mb-3">🗺️ Sitemap</h1>
          <p className="text-forest-300 text-lg">
            Complete overview of ProofStack pages and file structure
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Pages */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-forest-50 mb-6">📄 Pages</h2>

            {Object.entries(pages).map(([key, section]) => (
              <div key={key} className="bg-forest-900 border border-forest-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-forest-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h3 className="text-lg font-semibold text-forest-50">{section.title}</h3>
                    <span className="text-sm text-forest-400">({section.items.length})</span>
                  </div>
                  <span className="text-forest-400">
                    {expandedSections.includes(key) ? '▼' : '▶'}
                  </span>
                </button>

                {expandedSections.includes(key) && (
                  <div className="px-6 py-4 border-t border-forest-800 space-y-3">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-forest-800 transition-colors">
                        <div className="flex-1">
                          {item.path.includes('[') ? (
                            <div className="font-mono text-sm text-sage-400">{item.path}</div>
                          ) : (
                            <Link
                              href={item.path}
                              className="font-mono text-sm text-sage-400 hover:text-sage-300 underline"
                            >
                              {item.path}
                            </Link>
                          )}
                          <div className="font-semibold text-forest-50 mt-1">{item.name}</div>
                          <div className="text-sm text-forest-400">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Column: File Tree */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-forest-50 mb-6">
              {fileTree.icon} {fileTree.title}
            </h2>

            {fileTree.sections.map((section, idx) => (
              <div key={idx} className="bg-forest-900 border border-forest-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">📁</span>
                  <h3 className="text-lg font-semibold text-forest-50 font-mono">{section.name}</h3>
                </div>
                <p className="text-sm text-forest-400 mb-4">{section.description}</p>

                <div className="space-y-2 pl-6 border-l-2 border-forest-700">
                  {section.children.map((child, childIdx) => (
                    <div
                      key={childIdx}
                      className={`flex items-start gap-2 p-2 rounded ${
                        child.highlight ? 'bg-sage-900/20 border border-sage-800' : ''
                      }`}
                    >
                      <span className="text-forest-500">
                        {child.name.endsWith('/') ? '📂' : '📄'}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-forest-200">{child.name}</div>
                        <div className="text-xs text-forest-400">{child.description}</div>
                      </div>
                      {child.highlight && (
                        <span className="text-xs bg-sage-800 text-sage-200 px-2 py-1 rounded">NEW</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Features Section */}
        <div className="mt-12 bg-gradient-to-br from-sage-900/30 to-forest-900 border border-sage-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-sage-200 mb-4">🆕 Recent Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-forest-50">ProofScore V2</h3>
              <p className="text-sm text-forest-300">
                30/30/40 breakdown system with AI-powered profile and message analysis. Displays on portfolios and discovery pages.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded border border-blue-800">
                  Communication Quality (30pts)
                </span>
                <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800">
                  Historical Performance (30pts)
                </span>
                <span className="text-xs bg-emerald-900/30 text-emerald-300 px-2 py-1 rounded border border-emerald-800">
                  Work Quality (40pts)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-forest-50">Work Sample Verification</h3>
              <p className="text-sm text-forest-300">
                Employers submit 500-2000 char code/writing samples for AI quality analysis. Displays on portfolios with confidentiality options.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded border border-green-800">
                  🌐 Public
                </span>
                <span className="text-xs bg-yellow-900/30 text-yellow-300 px-2 py-1 rounded border border-yellow-800">
                  📝 Redacted
                </span>
                <span className="text-xs bg-gray-900/30 text-gray-300 px-2 py-1 rounded border border-gray-800">
                  🔒 Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-8 bg-forest-900 border border-forest-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-forest-50 mb-6">🛠️ Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-forest-800 rounded-lg">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-forest-50">Next.js 14</div>
              <div className="text-xs text-forest-400">App Router</div>
            </div>
            <div className="text-center p-4 bg-forest-800 rounded-lg">
              <div className="text-3xl mb-2">🗄️</div>
              <div className="font-semibold text-forest-50">Supabase</div>
              <div className="text-xs text-forest-400">PostgreSQL + Auth</div>
            </div>
            <div className="text-center p-4 bg-forest-800 rounded-lg">
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold text-forest-50">OpenAI</div>
              <div className="text-xs text-forest-400">GPT-4o-mini</div>
            </div>
            <div className="text-center p-4 bg-forest-800 rounded-lg">
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold text-forest-50">Tailwind CSS</div>
              <div className="text-xs text-forest-400">Styling</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-forest-400 mb-4">Need help navigating?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="px-4 py-2 bg-sage-800 text-sage-100 rounded-lg hover:bg-sage-700 transition-colors">
              ← Back to Home
            </Link>
            <Link href="/about" className="px-4 py-2 bg-forest-800 text-forest-100 rounded-lg hover:bg-forest-700 transition-colors">
              About ProofStack
            </Link>
            <Link href="/contact" className="px-4 py-2 bg-forest-800 text-forest-100 rounded-lg hover:bg-forest-700 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
